"""
Exam Hall PDF Parser
Extracts questions from structured PDF/text files from IIT Madras BS Data Science exams.

Usage:
    python parse_exam.py input.pdf output.json
    python parse_exam.py input.txt output.json
"""

import re
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

# Try to import pdfplumber for PDF support
try:
    import pdfplumber
    HAS_PDF_SUPPORT = True
except ImportError:
    HAS_PDF_SUPPORT = False
    print("Warning: pdfplumber not installed. PDF support disabled. Install with: pip install pdfplumber")


class QuestionType(str, Enum):
    MCQ = "MCQ"
    MSQ = "MSQ"
    SA = "SA"
    COMPREHENSION = "COMPREHENSION"


@dataclass
class Option:
    id: str
    text: str
    is_correct: bool = False


@dataclass
class Question:
    question_number: int
    question_id: str
    question_type: QuestionType
    question_text: str
    marks: float
    options: List[Option]
    correct_answer: Any  # Can be option ID, list of IDs, or numeric value
    section: str = ""
    is_comprehension_sub: bool = False
    parent_comprehension_id: Optional[str] = None


@dataclass
class ExamPaper:
    name: str
    subject: str
    term: str
    duration_minutes: int
    total_marks: float
    sections: List[str]
    questions: List[Question]


class ExamParser:
    """Parser for IIT Madras BS Data Science exam papers."""
    
    # Regex patterns for parsing
    PATTERNS = {
        "paper_name": r"Question Paper Name\s*:\s*(.+)",
        "subject_name": r"Subject Name\s*:\s*(.+)",
        "duration": r"Duration\s*:\s*(\d+)",
        "total_marks": r"Total Marks\s*:\s*(\d+)",
        "section_name": r"(Sem\d+\s+\w+\d*|Section\s*:\s*\w+)",
        "section_marks": r"Section Marks\s*:\s*(\d+)",
        "question_start": r"Question Number\s*:\s*(\d+)",
        "question_id": r"Question Id\s*:\s*(\d+)",
        "question_type": r"Question Type\s*:\s*(MCQ|MSQ|SA|COMPREHENSION)",
        "correct_marks": r"Correct Marks\s*:\s*(\d+\.?\d*)",
        "question_label": r"Question Label\s*:\s*(.+)",
        "options_section": r"Options\s*:",
        "option_item": r"(\d{10,15})\.\s*(.+?)(?=\d{10,15}\.|Sub-Section|Question Number|Possible Answers|$)",
        "possible_answers": r"Possible Answers\s*:\s*(.+?)(?=Sub-Section|Question Number|Question Id|$)",
        "comprehension_start": r"Question Type\s*:\s*COMPREHENSION",
        "comprehension_range": r"Question Numbers\s*:\s*\((\d+)\s*to\s*(\d+)\)",
    }
    
    def __init__(self, text: str):
        self.text = text
        self.lines = text.split('\n')
        self.current_section = ""
        self.current_comprehension_id = None
        
    def parse(self) -> ExamPaper:
        """Parse the exam paper and return structured data."""
        # Extract metadata
        paper_name = self._extract_match("paper_name") or "Unknown Paper"
        subject_name = self._extract_match("subject_name") or "Unknown Subject"
        duration = int(self._extract_match("duration") or 120)
        total_marks = float(self._extract_match("total_marks") or 50)
        
        # Extract questions
        questions = self._parse_questions()
        
        # Extract unique sections
        sections = list(set(q.section for q in questions if q.section))
        
        return ExamPaper(
            name=paper_name,
            subject=subject_name,
            term=self._extract_term(paper_name),
            duration_minutes=duration,
            total_marks=total_marks,
            sections=sections,
            questions=questions
        )
    
    def _extract_match(self, pattern_name: str) -> Optional[str]:
        """Extract first match for a pattern."""
        pattern = self.PATTERNS.get(pattern_name)
        if not pattern:
            return None
        match = re.search(pattern, self.text, re.IGNORECASE | re.MULTILINE)
        return match.group(1).strip() if match else None
    
    def _extract_term(self, paper_name: str) -> str:
        """Extract term from paper name (e.g., 'Aug 2025' -> 'August 2025')."""
        months = {
            'jan': 'January', 'feb': 'February', 'mar': 'March',
            'apr': 'April', 'may': 'May', 'jun': 'June',
            'jul': 'July', 'aug': 'August', 'sep': 'September',
            'oct': 'October', 'nov': 'November', 'dec': 'December'
        }
        for abbr, full in months.items():
            if abbr in paper_name.lower():
                year_match = re.search(r'20\d{2}', paper_name)
                year = year_match.group() if year_match else "2025"
                return f"{full} {year}"
        return "Unknown Term"
    
    def _parse_questions(self) -> List[Question]:
        """Parse all questions from the text."""
        questions = []
        
        # Split by question boundaries
        question_blocks = re.split(r'(?=Question Number\s*:\s*\d+)', self.text)
        
        for block in question_blocks:
            if not block.strip():
                continue
                
            question = self._parse_question_block(block)
            if question:
                questions.append(question)
        
        return questions
    
    def _parse_question_block(self, block: str) -> Optional[Question]:
        """Parse a single question block."""
        # Extract question number
        qnum_match = re.search(self.PATTERNS["question_start"], block)
        if not qnum_match:
            return None
        
        question_number = int(qnum_match.group(1))
        
        # Extract question ID
        qid_match = re.search(self.PATTERNS["question_id"], block)
        question_id = qid_match.group(1) if qid_match else f"q_{question_number}"
        
        # Extract question type
        qtype_match = re.search(self.PATTERNS["question_type"], block)
        if not qtype_match:
            return None
        question_type = QuestionType(qtype_match.group(1))
        
        # Extract marks
        marks_match = re.search(self.PATTERNS["correct_marks"], block)
        marks = float(marks_match.group(1)) if marks_match else 0
        
        # Extract question text (content between label and Options/Possible Answers)
        question_text = self._extract_question_text(block)
        
        # Extract options (for MCQ/MSQ)
        options = []
        correct_answer = None
        
        if question_type in [QuestionType.MCQ, QuestionType.MSQ]:
            options, correct_answer = self._parse_options(block)
        elif question_type == QuestionType.SA:
            correct_answer = self._parse_sa_answer(block)
        
        # Check for section
        section_match = re.search(r"Section\s*:\s*(\w+)", block, re.IGNORECASE)
        section = section_match.group(1) if section_match else self.current_section
        
        return Question(
            question_number=question_number,
            question_id=question_id,
            question_type=question_type,
            question_text=question_text,
            marks=marks,
            options=options,
            correct_answer=correct_answer,
            section=section
        )
    
    def _extract_question_text(self, block: str) -> str:
        """Extract the question text from a block."""
        # Find text between Question Label and Options/Possible Answers
        label_match = re.search(self.PATTERNS["question_label"], block)
        if not label_match:
            return ""
        
        start_idx = label_match.end()
        
        # Find end boundary
        end_patterns = [r"Options\s*:", r"Possible Answers\s*:", r"Response Type\s*:"]
        end_idx = len(block)
        
        for pattern in end_patterns:
            match = re.search(pattern, block[start_idx:], re.IGNORECASE)
            if match:
                end_idx = min(end_idx, start_idx + match.start())
        
        text = block[start_idx:end_idx].strip()
        
        # Clean up the text
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def _parse_options(self, block: str) -> tuple[List[Option], Any]:
        """Parse options from MCQ/MSQ block."""
        options = []
        correct_answers = []
        
        # Find options section
        options_match = re.search(self.PATTERNS["options_section"], block)
        if not options_match:
            return options, correct_answers
        
        options_text = block[options_match.end():]
        
        # Find all option items (ID followed by text)
        option_pattern = r"(\d{10,15})\.?\s*"
        option_matches = list(re.finditer(option_pattern, options_text))
        
        for i, match in enumerate(option_matches):
            option_id = match.group(1)
            
            # Get text until next option or end
            start = match.end()
            end = option_matches[i + 1].start() if i + 1 < len(option_matches) else len(options_text)
            option_text = options_text[start:end].strip()
            
            # Clean the text
            option_text = re.sub(r'\s+', ' ', option_text)
            option_text = option_text[:500]  # Limit length
            
            # Check if this option is marked as correct (green icon mentioned)
            is_correct = "correct" in option_text.lower() or bool(re.search(r'✓|✔|green', option_text, re.IGNORECASE))
            
            options.append(Option(
                id=option_id,
                text=option_text,
                is_correct=is_correct
            ))
            
            if is_correct:
                correct_answers.append(option_id)
        
        return options, correct_answers if correct_answers else None
    
    def _parse_sa_answer(self, block: str) -> Optional[str]:
        """Parse answer for Short Answer questions."""
        answer_match = re.search(self.PATTERNS["possible_answers"], block, re.DOTALL)
        if answer_match:
            answer = answer_match.group(1).strip()
            # Clean up - get first line or number
            answer = answer.split('\n')[0].strip()
            return answer
        return None


def parse_pdf(pdf_path: str) -> str:
    """Extract text from PDF file."""
    if not HAS_PDF_SUPPORT:
        raise ImportError("pdfplumber is required for PDF parsing. Install with: pip install pdfplumber")
    
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    
    return '\n'.join(text_parts)


def parse_exam_file(input_path: str) -> ExamPaper:
    """Parse an exam file (PDF or text) and return structured data."""
    path = Path(input_path)
    
    if path.suffix.lower() == '.pdf':
        text = parse_pdf(input_path)
    else:
        with open(input_path, 'r', encoding='utf-8') as f:
            text = f.read()
    
    parser = ExamParser(text)
    return parser.parse()


def save_to_json(exam_paper: ExamPaper, output_path: str):
    """Save exam paper to JSON file."""
    # Convert dataclasses to dicts
    data = asdict(exam_paper)
    
    # Convert enums to strings
    for q in data['questions']:
        q['question_type'] = q['question_type'].value if hasattr(q['question_type'], 'value') else q['question_type']
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved {len(data['questions'])} questions to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Parse IIT Madras BS DS exam papers")
    parser.add_argument("input", help="Input file path (PDF or text)")
    parser.add_argument("output", help="Output JSON file path")
    
    args = parser.parse_args()
    
    print(f"📄 Parsing: {args.input}")
    exam_paper = parse_exam_file(args.input)
    
    print(f"📚 Found {len(exam_paper.questions)} questions")
    print(f"📋 Subject: {exam_paper.subject}")
    print(f"📅 Term: {exam_paper.term}")
    print(f"⏱️  Duration: {exam_paper.duration_minutes} minutes")
    print(f"📊 Total Marks: {exam_paper.total_marks}")
    
    save_to_json(exam_paper, args.output)


if __name__ == "__main__":
    main()
