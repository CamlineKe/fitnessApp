"""
Model Manager - Lazy loading for ML models to prevent Render free tier timeout
Loads models on first request instead of at import time
"""
import os
import logging
import gc
import time

logger = logging.getLogger(__name__)

# Model cache
_models = {}
_model_load_times = {}
_model_status = {}


def get_model(model_name):
    """
    Lazy load models on first request.
    Returns the model data or None if not available.
    """
    global _models, _model_load_times, _model_status
    
    # Return cached model if available
    if model_name in _models:
        return _models[model_name]
    
    # Lazy load the model
    start_time = time.time()
    logger.info(f"🔄 Lazy loading {model_name} model...")
    
    try:
        if model_name == 'diet':
            from models.diet_recommender import load_model as load_diet_model
            model_data = load_diet_model()
            if model_data:
                _models[model_name] = model_data
                _model_status[model_name] = 'loaded'
            else:
                _model_status[model_name] = 'fallback'
                return None
                
        elif model_name == 'stress':
            from models.stress_analysis import load_model as load_stress_model
            model_data = load_stress_model()
            if model_data:
                _models[model_name] = model_data
                _model_status[model_name] = 'loaded'
            else:
                _model_status[model_name] = 'fallback'
                return None
                
        elif model_name == 'workout':
            from models.workout_recommender import load_model as load_workout_model
            model_data = load_workout_model()
            if model_data:
                _models[model_name] = model_data
                _model_status[model_name] = 'loaded'
            else:
                _model_status[model_name] = 'fallback'
                return None
        else:
            logger.error(f"Unknown model: {model_name}")
            return None
        
        load_time = time.time() - start_time
        _model_load_times[model_name] = load_time
        logger.info(f"✅ {model_name} model loaded in {load_time:.2f}s")
        
        # Force garbage collection after model load to free memory
        gc.collect()
        
        return _models.get(model_name)
        
    except Exception as e:
        logger.error(f"❌ Error loading {model_name} model: {e}")
        _model_status[model_name] = f'error: {str(e)}'
        return None


def get_model_status():
    """Return current status of all models"""
    return {
        'loaded_models': list(_models.keys()),
        'model_status': _model_status,
        'load_times': _model_load_times
    }


def clear_models():
    """Clear all loaded models to free memory (useful for health checks)"""
    global _models
    _models.clear()
    gc.collect()
    logger.info("🧹 Cleared all loaded models from memory")


def is_model_ready(model_name):
    """Check if a model is loaded and ready"""
    return model_name in _models
