"""
Exam Upload Service
Handles PDF upload, parsing, image extraction, and database insertion.
"""

import os
import io
import uuid
import base64
import tempfile
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
import json

import pdfplumber
from imagekitio import ImageKit
import psycopg2
from psycopg2.extras import RealDictCursor, Json

from app.core.config import Config


# Initialize ImageKit
# SDK v5 auto-reads from env vars: IMAGEKIT_PRIVATE_KEY
imagekit = None
if Config.IMAGEKIT_PRIVATE_KEY:
    try:
        imagekit = ImageKit(private_key=Config.IMAGEKIT_PRIVATE_KEY)
        print("✅ ImageKit initialized successfully")
    except Exception as e:
        print(f"⚠️ ImageKit initialization failed: {e}")
        imagekit = None
else:
    print("⚠️ ImageKit not configured - images will not be uploaded")


def get_db_connection():
    """Get PostgreSQL connection."""
    if Config.DATABASE_URL:
        return psycopg2.connect(Config.DATABASE_URL)
    return psycopg2.connect(
        host=Config.DB_HOST,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASS,
        port=Config.DB_PORT
    )


def upload_image_to_imagekit(image_bytes: bytes, filename: str) -> Optional[str]:
    """Upload image to ImageKit and return URL."""
    if not imagekit:
        print("ImageKit not configured, skipping image upload")
        return None
    
    try:
        # Convert bytes to base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # SDK v5 uses ik.files.upload()
        result = imagekit.files.upload(
            file=f"data:image/png;base64,{image_base64}",
            file_name=filename,
            folder="/exam_questions/",
            use_unique_file_name=True
        )
        
        if result and hasattr(result, 'url') and result.url:
            print(f"✅ Uploaded image: {result.url}")
            return result.url
    except Exception as e:
        print(f"⚠️ Failed to upload image: {e}")
    
    return None


def extract_images_from_page(page, page_num: int) -> List[Dict]:
    """Extract images from a PDF page."""
    images = []
    
    try:
        page_images = page.images
        for idx, img in enumerate(page_images):
            # Get image data
            image_bytes = img.get("stream", None)
            if image_bytes:
                # Try to extract raw image data
                try:
                    raw_data = image_bytes.get_data()
                    filename = f"page_{page_num}_img_{idx}.png"
                    images.append({
                        "data": raw_data,
                        "filename": filename,
                        "bbox": (img["x0"], img["top"], img["x1"], img["bottom"])
                    })
                except:
                    pass
    except Exception as e:
        print(f"Error extracting images from page {page_num}: {e}")
    
    return images


def parse_pdf_with_images(pdf_bytes: bytes) -> Dict:
    """Parse PDF and extract questions with images."""
    import re
    
    # Write to temp file for pdfplumber
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name
    
    try:
        full_text = ""
        all_images = []
        
        with pdfplumber.open(tmp_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
                
                # Extract images
                page_images = extract_images_from_page(page, page_num)
                all_images.extend(page_images)
        
        # Parse metadata
        paper_name = re.search(r"Question Paper Name\s*:\s*(.+)", full_text)
        subject_name = re.search(r"Subject Name\s*:\s*(.+)", full_text)
        duration = re.search(r"Duration\s*:\s*(\d+)", full_text)
        total_marks = re.search(r"Total Marks\s*:\s*(\d+)", full_text)
        
        # Parse questions
        questions = parse_questions_from_text(full_text)
        
        return {
            "name": paper_name.group(1).strip() if paper_name else "Unknown Paper",
            "subject": subject_name.group(1).strip() if subject_name else "Unknown Subject",
            "duration_minutes": int(duration.group(1)) if duration else 60,
            "total_marks": float(total_marks.group(1)) if total_marks else 50,
            "questions": questions,
            "images": all_images
        }
    finally:
        os.unlink(tmp_path)


def parse_questions_from_text(text: str) -> List[Dict]:
    """Parse questions from extracted text."""
    import re
    
    questions = []
    
    # Split by question boundaries
    question_blocks = re.split(r'(?=Question Number\s*:\s*\d+)', text)
    
    for block in question_blocks:
        if not block.strip():
            continue
        
        # Extract question number
        qnum_match = re.search(r"Question Number\s*:\s*(\d+)", block)
        if not qnum_match:
            continue
        
        question_number = int(qnum_match.group(1))
        
        # Extract question ID
        qid_match = re.search(r"Question Id\s*:\s*(\d+)", block)
        question_id = qid_match.group(1) if qid_match else f"q_{question_number}"
        
        # Extract question type
        qtype_match = re.search(r"Question Type\s*:\s*(MCQ|MSQ|SA|COMPREHENSION)", block)
        if not qtype_match:
            continue
        question_type = qtype_match.group(1)
        
        # Extract marks
        marks_match = re.search(r"Correct Marks\s*:\s*(\d+\.?\d*)", block)
        marks = float(marks_match.group(1)) if marks_match else 0
        
        # Extract question text
        label_match = re.search(r"Question Label\s*:\s*.+?\n(.+?)(?=Options|Possible Answers|Response Type|$)", block, re.DOTALL)
        question_text = label_match.group(1).strip() if label_match else ""
        question_text = re.sub(r'\s+', ' ', question_text)
        
        # Extract options for MCQ/MSQ
        options = []
        if question_type in ["MCQ", "MSQ"]:
            options_match = re.search(r"Options\s*:(.+?)(?=Sub-Section|Question Number|Possible Answers|$)", block, re.DOTALL)
            if options_match:
                options_text = options_match.group(1)
                option_pattern = r"(\d{10,15})\.?\s*(.+?)(?=\d{10,15}|$)"
                for match in re.finditer(option_pattern, options_text, re.DOTALL):
                    opt_id = match.group(1)
                    opt_text = match.group(2).strip()
                    opt_text = re.sub(r'\s+', ' ', opt_text)[:500]
                    is_correct = "(correct)" in opt_text.lower() or "✓" in opt_text
                    opt_text = opt_text.replace("(correct)", "").strip()
                    options.append({
                        "id": opt_id,
                        "text": opt_text,
                        "is_correct": is_correct
                    })
        
        # Extract answer for SA
        correct_answer = None
        if question_type == "SA":
            answer_match = re.search(r"Possible Answers\s*:\s*(.+?)(?=Sub-Section|Question Number|$)", block, re.DOTALL)
            if answer_match:
                correct_answer = answer_match.group(1).strip().split('\n')[0].strip()
        elif options:
            correct_answer = [opt["id"] for opt in options if opt.get("is_correct")]
        
        questions.append({
            "question_number": question_number,
            "question_id": question_id,
            "question_type": question_type,
            "question_text": question_text,
            "marks": marks,
            "options": options,
            "correct_answer": correct_answer
        })
    
    return questions


def save_exam_to_database(exam_data: Dict, subject_name: str, term: str, exam_type: str) -> str:
    """Save parsed exam data to PostgreSQL."""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Create or get subject
        cur.execute("""
            INSERT INTO subjects (id, name, code, level, created_at, updated_at)
            VALUES (gen_random_uuid(), %s, %s, 'foundation', NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """, (subject_name, subject_name.replace(" ", "_").upper()[:20]))
        
        result = cur.fetchone()
        if result:
            subject_id = result['id']
        else:
            cur.execute("SELECT id FROM subjects WHERE code = %s", (subject_name.replace(" ", "_").upper()[:20],))
            subject_id = cur.fetchone()['id']
        
        # Create term paper
        paper_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO term_papers (id, subject_id, name, term, exam_type, duration_minutes, total_marks, total_questions, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            paper_id,
            subject_id,
            exam_data.get("name", "Exam Paper"),
            term,
            exam_type,
            exam_data.get("duration_minutes", 60),
            exam_data.get("total_marks", 50),
            len(exam_data.get("questions", []))
        ))
        
        # Insert questions
        for q in exam_data.get("questions", []):
            question_uuid = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO questions (id, paper_id, question_number, question_id, question_type, question_text, question_image, options, correct_answer, marks, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                question_uuid,
                paper_id,
                q["question_number"],
                q["question_id"],
                q["question_type"],
                q["question_text"],
                q.get("image_url"),
                Json(q.get("options", [])),
                Json(q.get("correct_answer")),
                q["marks"]
            ))
        
        conn.commit()
        return paper_id
    
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


async def process_pdf_upload(pdf_bytes: bytes, subject_name: str, term: str, exam_type: str) -> Dict:
    """
    Main function to process PDF upload.
    1. Parse PDF
    2. Extract and upload images to ImageKit
    3. Save to database
    """
    # Parse PDF
    exam_data = parse_pdf_with_images(pdf_bytes)
    
    # Upload images to ImageKit and update question image URLs
    for idx, img in enumerate(exam_data.get("images", [])):
        image_url = upload_image_to_imagekit(img["data"], img["filename"])
        if image_url:
            # Try to associate with nearest question (simplified)
            # In production, you'd use bbox coordinates to match
            if idx < len(exam_data["questions"]):
                exam_data["questions"][idx]["image_url"] = image_url
    
    # Save to database
    paper_id = save_exam_to_database(exam_data, subject_name, term, exam_type)
    
    return {
        "success": True,
        "paper_id": paper_id,
        "questions_count": len(exam_data.get("questions", [])),
        "images_uploaded": len([q for q in exam_data["questions"] if q.get("image_url")])
    }
