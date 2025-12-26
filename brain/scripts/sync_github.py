import os
import argparse
from llama_index.readers.github import GithubRepositoryReader, GithubClient
from app.services.ingestion import IngestionService
from dotenv import load_dotenv

load_dotenv("../backend/.env")

def sync_github_repo(owner, repo, branch="main", category="academic"):
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ Error: GITHUB_TOKEN not found in .env. Please add it to /backend/.env")
        return

    print(f"🚀 Connecting to GitHub: {owner}/{repo}...")
    
    try:
        github_client = GithubClient(token)
        reader = GithubRepositoryReader(
            github_client = github_client,
        owner = owner,
        repo = repo,
        use_parser = True,
        filter_directories = (["src"], GithubRepositoryReader.FilterType.INCLUDE),
        filter_file_extensions = ([".md", ".txt"], GithubRepositoryReader.FilterType.INCLUDE)
    )
        
        documents = reader.load_data(branch=branch)
        print(f"✅ Found {len(documents)} academic documents.")

        service = IngestionService()
        print("🧠 Feeding the Antigravity Brain...")
        num_chunks = service.ingest_documents(documents, category)
        
        print(f"✨ Success! Ingested {num_chunks} chunks into the '{category}' category.")
    except Exception as e:
        print(f"❌ Sync failed: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync GitHub repo with Antigravity Brain")
    parser.add_argument("--owner", required=True, help="GitHub username/owner")
    parser.add_argument("--repo", required=True, help="GitHub repository name")
    parser.add_argument("--branch", default="main", help="Branch name (default: main)")
    parser.add_argument("--category", default="academic", help="Category (default: academic)")

    args = parser.parse_args()
    sync_github_repo(args.owner, args.repo, args.branch, args.category)
