import logging
import os
from datetime import datetime
import stat
import re

class Logger:
    _instance = None
    _logger = None
    
    # Patterns for sensitive data
    SENSITIVE_PATTERNS = [
        (r'password[\'":\s]*[^\s,;]{3,}', '***'),
        (r'token[\'":\s]*[^\s,;]{3,}', '***'),
        (r'api[_-]?key[\'":\s]*[^\s,;]{3,}', '***'),
        (r'secret[\'":\s]*[^\s,;]{3,}', '***'),
        (r'\b[\w.+-]+@[\w-]+\.[a-zA-Z0-9-.]+\b', '[EMAIL]'),  # Email addresses
        (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]'),  # Phone numbers
    ]

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if Logger._logger is not None:
            raise Exception("This class is a singleton!")
        
        # Create logs directory if it doesn't exist
        log_dir = "logs"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            # Secure the logs directory - 755 for directory
            os.chmod(log_dir, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

        # Set up logging
        Logger._logger = logging.getLogger("FitnessAI")
        
        # Set base level to DEBUG to capture all logs
        Logger._logger.setLevel(logging.DEBUG)

        # Create handlers
        console_handler = logging.StreamHandler()
        today = datetime.now().strftime('%Y-%m-%d')
        log_file = f"{log_dir}/fitnessai_{today}.log"
        file_handler = logging.FileHandler(log_file)
        
        # Secure log file - 644 for files
        if os.path.exists(log_file):
            os.chmod(log_file, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)

        # Set levels based on environment
        is_production = os.getenv('FLASK_ENV') == 'production'
        console_handler.setLevel(logging.WARNING if is_production else logging.DEBUG)
        file_handler.setLevel(logging.INFO)  # Always log INFO and above to file

        # Create formatters and add it to handlers
        console_format = logging.Formatter('%(levelname)s: %(message)s')
        file_format = logging.Formatter('%(asctime)s [%(levelname)s]: %(message)s')
        
        console_handler.setFormatter(console_format)
        file_handler.setFormatter(file_format)

        # Add handlers to the logger
        Logger._logger.addHandler(console_handler)
        Logger._logger.addHandler(file_handler)

    @staticmethod
    def _sanitize_message(message):
        """Remove sensitive information from log messages"""
        if not isinstance(message, str):
            message = str(message)
            
        # Apply each pattern replacement
        for pattern, replacement in Logger.SENSITIVE_PATTERNS:
            message = re.sub(pattern, replacement, message, flags=re.IGNORECASE)
        return message

    @classmethod
    def debug(cls, message):
        """Log debug message - only visible in development"""
        sanitized = cls._sanitize_message(message)
        cls.get_instance()._logger.debug(sanitized)

    @classmethod
    def info(cls, message):
        """Log info message - visible in development and logged to file"""
        sanitized = cls._sanitize_message(message)
        cls.get_instance()._logger.info(sanitized)

    @classmethod
    def warning(cls, message):
        """Log warning message - always visible and logged"""
        sanitized = cls._sanitize_message(message)
        cls.get_instance()._logger.warning(sanitized)

    @classmethod
    def error(cls, message):
        """Log error message - always visible and logged"""
        sanitized = cls._sanitize_message(message)
        cls.get_instance()._logger.error(sanitized)

    @classmethod
    def critical(cls, message):
        """Log critical message - always visible and logged"""
        sanitized = cls._sanitize_message(message)
        cls.get_instance()._logger.critical(sanitized)

    @classmethod
    def rotate_logs(cls, max_days=30):
        """Delete log files older than max_days"""
        log_dir = "logs"
        if not os.path.exists(log_dir):
            return
            
        current_time = datetime.now()
        for filename in os.listdir(log_dir):
            if not filename.startswith("fitnessai_"):
                continue
                
            filepath = os.path.join(log_dir, filename)
            file_time = datetime.fromtimestamp(os.path.getctime(filepath))
            if (current_time - file_time).days > max_days:
                try:
                    os.remove(filepath)
                    cls.info(f"Deleted old log file: {filename}")
                except Exception as e:
                    cls.error(f"Failed to delete old log file {filename}: {str(e)}") 