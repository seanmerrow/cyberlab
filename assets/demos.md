# Cyber Lab Demonstrations
Here are some practical cybersecurity demonstration scenarios you can run in your lab. Because your environment includes a pfSense router, isolated networks, a database, and a web server, you can perfectly mirror real-world attack and defense methods.

## Network Eavesdropping & Cleartext Exploitation
Demonstrate why encryption (HTTPS, SSH, TLS) is mandatory by intercepting unencrypted credentials passing through your router.

* The Setup: Configure a simple HTTP login page or an unencrypted FTP/Telnet service on the web server.
* The Attack: From the Linux desktop, log into the unencrypted service. Simultaneously, run Tcpdump on the web server or use the packet capture feature inside pfSense on that specific interface.
* The Demonstration: Open the captured .pcap file in Wireshark or Tshark. Use the "Follow TCP Stream" feature to reveal the plain-text username and password exactly as they were typed.
* The Defense: Implement an SSL/TLS certificate on the web server and enforce HTTPS. Re-run the packet capture to show that the credentials are now unreadable gibberish.

## Brute Force & Automated Account Lockout
Demonstrate how automated tools guess passwords rapidly and how automated defense tools stop them instantly.

* The Setup: Enable SSH access on the web server or database server. Use a weak, common password for a test account.
* The Attack: Use Hydra from the Linux desktop to launch a dictionary attack against the server's SSH port using a basic wordlist. Show how fast the tool can guess the password.
* The Defense: Install Fail2ban on the targeted server. Configure it to monitor SSH logs and ban any IP address that fails three login attempts.
* The Show: Run the Hydra attack a second time. Show that after three quick attempts, Fail2ban drops the connection, updates the local firewall (iptables/nftables), and completely blocks the Linux desktop from reaching the server.

Would you like step-by-step instructions or commands for setting up one specific scenario from this list?

