"""
File handling utilities for dataset uploads
"""
import os
import aiofiles
from fastapi import UploadFile
import pandas as pd
from typing import Tuple
import uuid

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save uploaded file to disk
    
    Args:
        upload_file: FastAPI UploadFile object
        
    Returns:
        Path to saved file
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file asynchronously
    async with aiofiles.open(file_path, 'wb') as f:
        content = await upload_file.read()
        await f.write(content)
    
    return file_path

def validate_csv(file_path: str) -> Tuple[bool, str]:
    """
    Validate CSV or Excel file structure
    
    Args:
        file_path: Path to CSV or Excel file
        
    Returns:
        Tuple of (is_valid, message)
    """
    try:
        # Determine file type and read accordingly
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.csv':
            df = pd.read_csv(file_path)
        elif file_extension in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            return False, "Unsupported file format. Please upload CSV or Excel file"
        
        # Check if file is empty
        if len(df) == 0:
            return False, "Dataset is empty"
        
        # Check minimum samples
        if len(df) < 10:
            return False, "Dataset must contain at least 10 samples"
        
        # Check for at least one feature
        if len(df.columns) < 2:
            return False, "Dataset must contain at least 2 columns (features + label)"
        
        return True, "Valid dataset"
        
    except pd.errors.EmptyDataError:
        return False, "File is empty"
    except pd.errors.ParserError:
        return False, "Invalid file format"
    except Exception as e:
        return False, f"Validation error: {str(e)}"

def get_file_size(file_path: str) -> int:
    """Get file size in bytes"""
    return os.path.getsize(file_path)

def delete_file(file_path: str) -> bool:
    """Delete file from disk"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False
