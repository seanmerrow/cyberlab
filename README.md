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






