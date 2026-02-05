import subprocess
import os
import time

def run_in_new_window(command, cwd, title):
    print(f"[*] Launching {title} in a new window...")
    # 'start' is the most reliable way to force a new window on Windows
    # Syntax: start "Title" cmd /c "command"
    full_cmd = f'start "{title}" cmd /c "{command}"'
    return subprocess.Popen(full_cmd, cwd=cwd, shell=True)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    nginx_dir = os.path.join(root_dir, "nginx")

    venv_python = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = "python"

    # Unique titles to ensure we can kill them accurately
    titles = ["TM_BACKEND", "TM_FRONTEND", "TM_NGINX"]

    try:
        # 1. Backend
        run_in_new_window(
            f'"{venv_python}" manage.py runserver 0.0.0.0:8000',
            cwd=backend_dir,
            title="TM_BACKEND"
        )

        # 2. Frontend
        run_in_new_window(
            'npm run dev',
            cwd=frontend_dir,
            title="TM_FRONTEND"
        )

        # 3. Nginx
        # Nginx.exe window will show logs or errors if they occur
        run_in_new_window(
            'nginx.exe',
            cwd=nginx_dir,
            title="TM_NGINX"
        )

        print("\n" + "="*60)
        print(" [!] ALL SYSTEMS STARTING IN SEPARATE WINDOWS ")
        print(" Frontend: http://localhost:3000")
        print(" Nginx:    http://localhost")
        print(" Backend:  http://localhost:8000")
        print("\n KEEP THIS TERMINAL OPEN.")
        print(" Press Ctrl+C HERE to close ALL windows and stop the site.")
        print("="*60 + "\n")

        while True:
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\n[*] Shutting down everything...")
        
        # 1. Stop Nginx properly via its signal
        subprocess.run("nginx.exe -s stop", cwd=nginx_dir, shell=True, capture_output=True)
        
        # 2. Kill windows by their specific titles
        for title in titles:
            print(f"[*] Closing {title} window...")
            subprocess.run(f'taskkill /F /FI "WINDOWTITLE eq {title}*" /T', shell=True, capture_output=True)
            
        print("[+] All systems stopped successfully.")

if __name__ == "__main__":
    main()
