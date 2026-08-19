# Patient Records Viewer

A web-based medical records viewer built with Node.js and MariaDB. Provides a professional UI for searching and viewing patient demographics, encounters, medical history, and vitals.

## What to Copy

Copy the entire project directory to the target machine, **excluding** `node_modules/` and `.env`. The dependencies will be installed fresh on the target. Your `.env` file contains credentials and should be created manually on the target.

Files and directories to copy:

```
server.js
db.js
package.json
package-lock.json
patients_schema.sql
.env.example
.gitignore
middleware/
routes/
public/
```

You can use `rsync` or `scp` to transfer:

```bash
# From the source machine (adjust user, host, and paths as needed)
rsync -av --exclude='node_modules' --exclude='.env' /path/to/cyberlab/ user@target-host:/opt/patient-records/
```

Or with scp:

```bash
scp -r /path/to/cyberlab/ user@target-host:/opt/patient-records/
# Then remove node_modules on the target and reinstall (see below)
```

## Dependencies to Install on Fedora

### 1. Node.js

```bash
sudo dnf install -y nodejs npm
```

Verify the installation:

```bash
node --version    # Should be v18 or later
npm --version
```

### 2. MariaDB Client Libraries

The app connects to a MariaDB database. If the database is on a separate server, you only need the client:

```bash
sudo dnf install -y mariadb
```

If the database will run on the same machine:

```bash
sudo dnf install -y mariadb-server
sudo systemctl enable --now mariadb
sudo mysql_secure_installation
```

Then load the schema:

```bash
mysql -u root -p < /opt/patient-records/patients_schema.sql
```

### 3. Firewall (if accessing from other machines)

```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Setup

### 1. Install Node.js dependencies

```bash
cd /opt/patient-records
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```
DB_HOST=localhost          # or the IP of your MariaDB server
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=patient_sim_db

APP_PORT=3000
SESSION_SECRET=some-random-string-here

APP_USERNAME=admin
APP_PASSWORD=admin
```

### 3. Test that it starts

```bash
npm start
```

Open a browser to `http://<server-ip>:3000` and verify you can log in and search patients.

## Running as a System Service

To make the app start automatically on boot (and restart if it crashes), create a systemd service:

### 1. Create a dedicated user (optional but recommended)

```bash
sudo useradd -r -s /sbin/nologin patientapp
sudo chown -R patientapp:patientapp /opt/patient-records
```

### 2. Create the service file

```bash
sudo tee /etc/systemd/system/patient-records.service > /dev/null << 'EOF'
[Unit]
Description=Patient Records Viewer
After=network.target mariadb.service

[Service]
Type=simple
User=patientapp
WorkingDirectory=/opt/patient-records
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

If you did not create the dedicated user, change `User=patientapp` to your own username.

### 3. Enable and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable patient-records
sudo systemctl start patient-records
```

### 4. Check status

```bash
sudo systemctl status patient-records
```

### 5. View logs

```bash
sudo journalctl -u patient-records -f
```

## Managing the Service

```bash
sudo systemctl stop patient-records       # Stop the app
sudo systemctl restart patient-records     # Restart after config changes
sudo systemctl disable patient-records     # Disable auto-start on boot
```

## MariaDB Remote Access

If the database is on a different machine, make sure the MariaDB user has permission to connect from the app server's IP:

```sql
GRANT ALL PRIVILEGES ON patient_sim_db.* TO 'your_user'@'app-server-ip' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Make sure Node.js v18+ is installed: `node --version` |
| Cannot connect to MariaDB | Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`. Verify the MariaDB user has GRANT for the app server's IP. |
| Page loads but no patients | Check the server console (`journalctl -u patient-records -f`) for database errors. |
| Cannot reach from browser | Check firewall: `sudo firewall-cmd --list-ports`. Ensure port 3000 is open. |
| Service won't start | Check `WorkingDirectory` path exists and the service user owns it. Run `node server.js` manually to see errors. |
