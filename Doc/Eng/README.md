﻿# TERA PLATFORM

* What is the project and what he does we recommend you to read this review article: [Decentralized applications on TERA platform](https://medium.com/@evkara777/decentralized-applications-on-tera-platform-2aa56b597ae9)
* The following describes how to install it on your computer

## Light-wallet (web-version)
https://terawallet.org
* Note: the light wallet has a decentralized core - i.e. it works with all available nodes in the network


## Installing decentralized light wallet from setup on Windows:
* https://gitlab.com/terafoundation/terarun/raw/master/Bin/Light/tera_light_setup.exe
* [Light client (zip)](https://gitlab.com/terafoundation/terarun/raw/master/Bin/Light/Tera-light.zip)


## Installing full node from setup on Windows:
https://gitlab.com/terafoundation/terarun/raw/master/Bin/Full/tera_full_setup.exe

## Installing full node from source code by steps:

Attention:
* After the installation shown below, enter the address your server in the browser. Example: 12.34.56.78:8080
* For mining You must have a static (public) IP address and an open port.
* We recommend not storing private keys on remote servers.
* We recommend putting an additional password on the private key ("Set password" button) - in this case the private key will be stored in file in encrypted form.
* If you do not set http-password, you can access only from the local address: 127.0.0.1:8080
* For remote access to the node only from the specified computer set the HTTP_IP_CONNECT constant (for example: "HTTP_IP_CONNECT": "122.22.33.11")
* When installing, pay attention to the **secp256k1** cryptographic library. There should be no errors when compiling it (with command: npm install)



## Installing on Windows:

1. Download and install Nodejs https://nodejs.org
2. Download and install git https://git-scm.com/download/win
3. Then run the commands (in program: cmd or PowerShell):

```
cd ..\..\..\
git clone https://git.code.sf.net/p/tera/code wallet
npm install --global --production windows-build-tools
npm install -g node-gyp
cd wallet/Source
npm install
node set httpport:8080 password:<secret word (no spaces)>
run-node.bat

```
If you want to run the wallet as a background process, then instead of the last command (run-node.bat), do the following:
```
npm install pm2 -g
pm2 start run-node.js
```

### Opening ports:
```
netsh advfirewall firewall add rule name="Open 30000 port" protocol=TCP localport=30000 action=allow dir=IN
```

### Updates

```
cd wallet
git reset --hard 
git clean -f
git pull 
```



## Installation on Linux 

### CentOS 7:


```
sudo yum install -y git
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
sudo yum  install -y nodejs
sudo yum install gcc gcc-c++
sudo npm install pm2 -g
sudo git clone https://git.code.sf.net/p/tera/code wallet
cd wallet/Source
sudo npm install
sudo node set httpport:8080 password:<secret word (no spaces)>
sudo pm2 start run-node.js
```

### open ports (all):
```
systemctl stop firewalld 
systemctl disable firewalld
```

### Updates

```
cd wallet
sudo git reset --hard 
sudo git clean -f
sudo git pull 
```



### UBUNTU 18.4:

```
sudo apt-get install -y git
sudo apt-get install -y nodejs
sudo apt-get install -y npm
sudo npm install pm2 -g
sudo git clone https://git.code.sf.net/p/tera/code wallet
sudo apt install build-essential
sudo apt group install "Development Tools"
cd wallet/Source
sudo npm install
sudo node set httpport:8080 password:<secret word (no spaces)>
sudo pm2 start run-node.js
```

### open ports:

```
sudo ufw allow 30000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 80/tcp
```




### Updates

```
cd wallet
sudo git reset --hard 
sudo git pull 
```

## MAIN NETWORK
Default values:
```
port:30000
httpport:8080
```



## TEST NETWORK
Default values:
```
port:40000
httpport:8080
```
Launch: 
```
cp -a Source SourceTest
cd SourceTest
sudo node set-test httpport:8080 password:SecretWord
sudo pm2 start run-test.js
```








## Specification

* Name: TERA
* Consensus: PoW
* Algorithm:  Terahash (sha3 + Optimize RAM hashing)
* Total suplay: 1 Bln
* Reward for block (befor 43 mln blocks): 1-20 coins, depends on network power (one billionth of the remainder of undistributed amount of coins and multiplied by the hundredth part of the square of the logarithm of the network power).  With a block of 22.5 million, the power for the reward is limited to a constant of 43.
* Block size 130 KB
* Premine: 5%
* Development fund: 1% of the mining amount
* Block generation time: 1 second
* Block confirmation time: 8 seconds
* Speed: from 1000 transactions per second
* Commission: free of charge 
* Cryptography: sha3, secp256k1
* Protection against DDoS: PoW (hash calculation)
* Platform: Node.JS


# FAQs

## Mining is possible only on a public IP
* Check the presence of a direct ip-address (order from the provider)
* Check if the port is routed from the router to your computer
* Check the firewall (port must open on the computer)



## Refs:
* Web: http://terafoundation.org
* Btt: https://bitcointalk.org/index.php?topic=4573801.0
* Twitter: https://twitter.com/terafoundation
* Telegram: https://t.me/terafoundation
* Discord: https://discord.gg/CvwrbeG
* [White Paper](https://docs.google.com/document/d/1EaqFg1ncIxsrNE2M9xJOSzQu8z3ANwMuNyTX0z_A1ow/edit?usp=sharing)
* [DApp Paper](https://docs.google.com/document/d/1PXVBbMKdpsAKPkO9UNB5B-LMwIDjylWoHvAAzzrXjvU/edit?usp=sharing)
* [DEX-guide](https://docs.google.com/document/d/1qvVRfLq3qcYYF6dcsAAAqoGyBFF4njXUYZXZfTPWd2w/edit?usp=sharing)
* [BTC for DEX](https://docs.google.com/document/d/19vRY6tkbTP8tubZxM01llwnMyz4P6IzY0zvnargrU6k/edit?usp=sharing)
* [API](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Eng/API.md)
* [API-2](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Eng/API2.md)
* [CONSTANTS](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Eng/CONSTANTS.MD)

##Blockchain:
* [WEB-Wallet](https://terawallet.org)
* [Explorer](https://teraexplorer.org)


## Chinese
* [Mining guide (chinese PDF)](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Chinese/Mining.pdf?format=raw)
* [Tera White Paper (chinese PDF)](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Chinese/WP_chinese.pdf?format=raw)


Articles:
* [Decentralized applications on TERA platform](https://medium.com/@evkara777/decentralized-applications-on-tera-platform-2aa56b597ae9)
* [How does TERA platform work](https://medium.com/@Blockchainize1/how-does-tera-platform-work-cbfbeefdfc12)
* [More articles...](https://terafoundation.org/blog/)


## RUS
 [Эта же страница на русском](https://sourceforge.net/p/tera/code/ci/master/tree/Doc/Rus)

