FROM python:3.9-slim

# Create a user with UID 1000 to comply with Hugging Face Space security
RUN useradd -m -u 1000 user
USER user

# Set environment variables
ENV PATH="/home/user/.local/bin:$PATH"
WORKDIR /home/user/app

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files (app.py, faiss.index, meta.npy)
COPY --chown=user . .

# Expose port 7860
EXPOSE 7860

# Command to run the Flask app
CMD ["python", "app.py"]
