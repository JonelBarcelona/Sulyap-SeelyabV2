Go to render.com and sign up (you can sign in with your GitHub account)

Click New → Web Service

Click Connect a repository → select your GitHub repo

Fill in these settings:
Name: anything you like
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app

Scroll down to Environment Variables → add:
Key: SESSION_SECRET → Value: any random string (e.g. mysecretkey123)
Click Create Web Service

Render will build and deploy — takes about 2–3 minutes. When it's done, you'll get a free URL like https://sulyap-seelyab.onrender.com.