# Fitness AI Service

This is the AI service component of the Fitness Application, providing endpoints for diet recommendations, stress analysis, and workout recommendations.

## Features

- Diet recommendations based on user preferences and goals
- Stress level analysis
- Personalized workout recommendations
- Health monitoring endpoint
- Production-ready configuration with Gunicorn
- Secure headers and CORS configuration

## Prerequisites

- Python 3.8+
- pip (package installer)

## Local Development Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file:
   ```
   FLASK_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. Run the development server:
   ```bash
   python app.py
   ```

## Production Deployment (Render)

1. Ensure your code is pushed to GitHub

2. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Select the `flask-ai` directory
   - Render will automatically detect the Python environment

3. Configure environment variables in Render dashboard:
   - `FLASK_ENV`: Set to `production`
   - `ALLOWED_ORIGINS`: Set to your frontend domain(s)

4. Deploy:
   - Render will automatically deploy your service
   - Monitor the deployment logs for any issues

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/diet`: Get diet recommendations
- `POST /api/stress`: Analyze stress levels
- `POST /api/workout`: Get workout recommendations

## Monitoring

- Health check endpoint at `/health`
- Logs are available in the `logs/` directory
- Production logs are streamed to Render dashboard

## Security

- Secure headers configured
- CORS protection
- Environment variable management
- SSL/TLS in production

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License
