# Photo Frame Android Tablet

(... Building ...) 

All the components to create a docker container to manage a tablet (Android/Kodi) as photoframe.

Components:
	- Android Kitkat rooted old Tablet 10.1" (BQ Edison 2) with Kodi/SPMC installed and debug/adb over the network (active in the preferences or by adb wifi apps)  
	- TpLink Smart Plug HS100
	- A linux (ubuntu 16.04) server with docker+rancher infraestructure.
	
The mission:
	- Get the tablet on/off in especificied hours a day (example, on: 16:00 --> 23:00 suspend: 23:00-->16:00)
	- Get the tablet battery loaded (20%-80%) in a cicle of charge/discharge
	- The tablet must be fully functional... you can take/unplug and normal use (internet, etc,etc.)
	- When the system is in home 5-10 minutes it starts kodi/spmc and launch screen saver.
	- If battery is low (<10%) and doesn´t charges (forgot unplugged) the system shutdown.
	- The tablet doesn´t have shutdown/start.
	- The slideshow photos are in a server accesible by SFTP/FTP or another protocol supported by Kodi/SPMC. 
	
Why don´t want to use "automate" or "tasker"? 
   Sure all the programming can be done with tasker but this project try to set the control of all actions in the home server to do complex planifications and easy modifications.
   
Why to use docker and rancher?
	I have a home server (now says home cloud) for a lot of years to develop diferents projects and to investigate/learn about technologies. All my systems ends corrupt because a build of a library or kernel module and needs to be reinstalled once a year with a lot of work.
	With docker I will try to isolate the diferent projects and manage the containers to get running only the projects that I need in each moment and when the base system will be corrupted (It´s sure) reduce the work needed to have everything working.
	Rancher helps a lot to manage the containers, grouping, intall, etc.
	
Go ahead!

Step 1. Setting Up The Tablet.

My tablet have a cooked rom with root.
Activate developing options in android settings (a lot of taps in kernel versions)
Activate the adb 
Activate the adb over the network persistent (setprop persist.adb.tcp.port 5555) or use an app that run at startup
Disable screen lock (we will launch kodi with adb over the network)
Install Kodi/SPMC app.
Set screensaver to point to the server and path where the photos are stored

Step 2. Setting Up The HS100 smart plug.

Plug the plug and configure the tp-link cloud plug (It can be configured with the tablet or another phone)

Step 3. Setting the IPs.

Setting a fixed IP in the router is the simpliest mode to assign a IP to a device. It avoid a lot of work in discovery protocols. All devices are in a private network and the plan is to set up all the devices and not to change them every days.

Go to the router administration and take the manual to set fixed IPs to the MACs or Devices.
  
Step 4. Install docker container.



  
	  

