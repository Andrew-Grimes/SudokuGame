web: gunicorn --workers $(expr $(nproc) \* 2 + 1) --threads 2 --timeout 120 --bind 0.0.0.0:8000 app:app
1