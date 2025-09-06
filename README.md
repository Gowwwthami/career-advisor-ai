# career-advisor-ai

# Career Advisor AI - Backend

### Setup
1. Create a virtual environment:
   python -m venv venv
   source venv/bin/activate   # (Mac/Linux)
   venv\Scripts\activate      # (Windows)

2. Install dependencies:
   pip install -r requirements.txt

3. Run server:
   python app.py

### API Endpoints
- GET `/` → test if server is running
- POST `/ask` → send a JSON { "question": "..." } to get AI response
