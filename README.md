# cyberlab
Cyber lab on Proxmox

## Proxmox installation


## Disable Proxmox Enterprise repository
1. Select the Proxmox host (ie. cyberlab)
2. In the **Updates** menu, select **Repositories**
3. Select the respository `https://enterprise.proxmox.com/debian/pve`
4. Click on **Disable**
5. Click **Add** and select the **No-Subscription** repository from the dropdown menu, then click **Add** again
6. Select the respository `https://enterprise.proxmox.com/debian/ceph-squid`
7. Click on **Disable**
8. Click **Add** and select the **Ceph Squid No-Subscription** repository from the dropdown menu, then click **Add** again

### Add Open vSwitch
Install openvswitch on the Proxmox host.

1. Right-click on the Proxmox host
2. Select **Shell**

```
apt update
apt install openvswitch-switch
```


## Database server
Enable SSH on the VM and open the service in the firewall
```
# Enable SSH
sudo systemctl enable --now sshd

# Add the service to the firewall
sudo firewall-cmd --add-service=ssh --permanent
sudo firewall-cmd --reload
```
You can now SSH into the VM rather than working from the VM's console within Proxmox
```
# SSH to the IP address of the VM
ssh smerrow@192.168.86.43
```

Update packages on the VM, and install MariaDB. Then start it up and set it to start any time the VM boots up.

```
# Install MariaDB
sudo dnf upgrade --refresh -y
sudo dnf install mariadb-server -y

# Start the `mariadb` service and enable it to start at boot up
sudo systemctl enable --now mariadb

# Verify it is running
systemctl status mariadb
```
Execute the MariaDB security script to secure root access, drop default anonymous users, and remove test databases
```
sudo mariadb-secure-installation
```
Follow the interactive prompts:

> [!IMPORTANT]
> Use the answers below, not what is recommended by the script. 

- **Enter current password for root**: Press Enter (default is blank).
- **Switch to unix_socket authentication**: Y.
- **Change root password**: Y (set a strong administrative password).
- **Remove anonymous users**: Y.
- **Disallow root login remotely**: Y.
- **Remove test database and access to it**: Y.
- **Reload privilege tables now**: Y.

Create the Medical Application Database & User
```
# Log in as root
sudo mariadb -u root -p
```
Inside the MariaDB shell, create a dedicated database using utf8mb4 encoding (essential for handling complex medical records and international patient names) and a non-root application user. You can simply paste the following lines into the database prompt.
```
CREATE DATABASE patient_sim_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'med_app_user'@'localhost' IDENTIFIED BY 'cyberisfun';

GRANT ALL PRIVILEGES ON patient_sim_db.* TO 'med_app_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```
Confirm that the new application user can log into the database without root privileges:
```
# Log into mariadb, and switch into the patient_sim_db database
mariadb -u med_app_user -p patient_sim_db

# If the prompt changed to the db name, then you can exit
exit
```

### Create database schema
To create the database schema, which includes all the tables, fields and data definitions, use the file [patients_schema.sql](assets/patients_schema.sql) and run the following command.
```
mariadb -u med_app_user -p patient_sim_db < patients_schema.sql
```

### Seed a single patient record
You can now add a single patient record into the database to verify if everything looks good. Use [sample_patient.sql](assets/sample_patient.sql) as follows:
```
mariadb -u med_app_user -p patient_sim_db < sample_patient.sql
```
View the tables and patient.
```
-- List all created tables
SHOW TABLES;

-- Inspect the structure of a specific table
DESCRIBE patients;
```

### See 1000 sample patients
Use the [seed_patients.py](assets/seed_patients.py) Python script to seed 1000 patients into the database.
```
# Install required packages
pip install faker mysql-connector-python

# Run the seed script
python seed_patients.py
```





