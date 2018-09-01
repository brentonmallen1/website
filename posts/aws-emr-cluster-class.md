title: AWS EMR Cluster Class Using Boto
slug: aws-emr-cluster-class
date: 2015-07-11 02:26:07 UTC-04:00
tags: aws
category:
link: 
description: 
type: text

I've been working with boto for a little while now, and while I know that
there are quite a few examples out there on how to spin up an AWS EMR cluster,
I couldn't find anything that put everything together.  With that in mind, I
present a python class which provides the user with the means to edit cluster
attributes, add steps, start a cluster, ssh into the cluster as well as
terminate the cluster, in a convenient package.

The entire code can be pulled from [here](https://github.com/brentonmallen1/aws_cluster),
but I give a brief overview of each method to, hopefully, shine some light
onto something that took me a while to hammer out.

<!-- TEASER_END -->

I recommend pulling the code from Github vs. copying from here as there may
be whitespace or indentation issues.  The **self_test** method gives an example
of a practical use of the class.

**Versions: [boto 2.38.0](https://github.com/boto/boto), python 2.7

**Assumptions: boto is installed, .boto file is configured
([how to](http://boto.readthedocs.org/en/latest/getting_started.html))

### `__init__`:

The cluster class can be instantiated with the following keyword arguments
(and their default values):

**Note: Some of the default keyword args will have to be adjusted for your
application. ami version, hadoop, hive, etc. versions can supposedly be set
to 'latest' but I haven't had much luck with that, so I manually set the
version to the latest version available at the time of writing this.

```
cluster_name = "Test Cluster",
cluster_region="us-ease-1",
cluster_zone="us-east-1e",
cluster_market = "SPOT",
spot_price = "2.02",
ami_version="3.1.2",
hadoop_version = "2.4.0",
keep_alive = True,
log_location = "S3://cluster_logs/",
tags={"key":"value"},
hive_version = "0.11.0.2",
impala_version = "1.2.4",
bootstrap_script = "",
ec2_keyname = "",
pem_key = "",
debugging = True,
failure_action = "CANCEL_AND_WAIT",
master_type = "m3.xlarge",
core_type = "m3.xlarge",
num_core_nodes = 10
```

```
__author__ = 'brentonmallen'

import time
import boto
import boto.emr
import boto.emr.emrobject
from boto.emr.instance_group
import InstanceGroup
from boto.manage.cmdshell
import sshclient_from_instance
from os.path import expanduser, isfile
import sys

class emr_cluster()
 def __init__(self, cluster_name = "Test Cluster", cluster_region="us-ease-1",
     cluster_zone="us-east-1e", cluster_market = "SPOT", spot_price = "2.02",
     ami_version="3.1.2", hadoop_version = "2.4.0", keep_alive = True,
     log_location = "S3://cluster_logs/", tags={"key":"value"},
     hive_version = "0.11.0.2", impala_version = "1.2.4", bootstrap_script = "",
     ec2_keyname = "", pem_key = "", debugging = True, failure_action = "CANCEL_AND_WAIT",
     master_type = "m3.xlarge", core_type = "m3.xlarge", num_core_nodes = 10):
 
     """ This is a AWS EMR Cluster class. Used to spin up, interact with and terminate
     an Amazon Web Service EMR cluster.
     
     PARAMETERS:
     cluster_name - (str) Name of the cluster. As it will appear in the AWS EMR Console cluster list
     cluster_region - (str) AWS compute region
     cluster_zone - (str) AWS compute zone
     cluster_market - (str) cluster market [on demand or spot]
     spot_price - (str) spot bid price
     ami_version - (str) version of AMI to be used
     hadoop_version - (str) version of hadoop to be used
     keep_alive - (bool) keep the cluster running when jobflow is finished
     log_location - (str) s3 location to stash the cluster logs
     tags - (dict) key:value pairs of cluster tags
     hive_version - (str) version of Hive to be installed
     impala_version - (str) version of impala to be installed
     bootstrap_script - (str) directory to shell script to be run at cluster bootstrap ['~/bash.sh']
     ec2_keyname - (str) cluster security key name
     pem_key - (str) location of pem key file ['~/key.pem']
     debugging - (bool) enable cluster debugging
     failure_action - (str) step to take if step fails
     master_type - (str) ec2 instance type
     core_type - (str) ec2 instance type
     num_core_nodes - (int)
     
     METHODS:
     check_pem_key - checks to see if the pem key exists in the specified location
     check_cluster_exists - checks to see if a cluster with the given name is already running
     load_cluster - if the cluster exists, connect to that cluster
     set_instance_group - compiles the cluster instance group
     set_cluster_steps - compiles the list of steps
     start_cluster - starts the cluster request
     get_connection - sets up the connection to aws
     get_cluster_status - returns the cluster's current status
     get_cluster_dns - returns the cluster's master public DNS
     get_cluster_ssh - returns a ssh client object to the cluster's master instance
     kill_cluster - terminates the cluster
     """ 
 
 # SET/INITIALIZE COMMON ATTRIBUTES
     self.cluster_name = cluster_name # set cluster name
     self.pem_key = pem_key # set pem key location
     self.check_pem_key(self.pem_key) # check that the pem exists
     self.cluster_region = cluster_region # set cluster region
     self.cluster_zone = cluster_zone # set cluster zone
     self.get_connection() # establish connection with aws
     self.cluster_dns = "" # initialize dns value attribute
     self.cluster_ssh = None # initialize ssh client object attribute
 
 # CHECK FOR EXISTING, RUNNING CLUSTER
     self.check_cluster_exists(self.cluster_name)
     if self.cluster_exists is False: # if cluster does not exist 
 
         # GENERAL CLUSTER PARAMETERS
         self.cluster_market = cluster_market
         self.cluster_spot_price = spot_price
         self.cluster_ami_version = ami_version
         self.cluster_hadoop_version = hadoop_version
         self.cluster_keep_alive = keep_alive
         self.cluster_log_location = log_location
         self.cluster_tags = tags
         self.cluster_hive_version = hive_version
         self.cluster_impala_version = impala_version
         self.cluster_bootstrap_script_location = bootstrap_script
         self.cluster_ec2_keyname = ec2_keyname
         self.cluster_enable_debugging = debugging
         self.cluster_action_on_failure = failure_action
 
         # CONTINUE, TERMINATE_JOB_FLOW # MASTER NODE PARAMETERS
         self.master_node_name = "Cluster Master"
         self.master_number_nodes = 1
         self.master_instance_type = master_type
         self.master_node_role = "MASTER"
 
        # CORE NODE PARAMETERS
        self.core_node_name = "Cluster Core"
        self.core_number_nodes = num_core_nodes
        self.core_instance_type = core_type
        self.core_node_role = "CORE" 
        
        # INIT METHODS 
        self.set_instance_group() # compile node instances
        self.set_cluster_steps() # compile cluster steps
    else:
        print "Cluster [{}] exists. Connected.".format(self.cluster_name)
```

### Check PEM Key:

This method checks that the pem key specified does indeed exist.  The
input argument is a string of the path to the pem file (i.e. "~/path/to/key.pem")

```
 def check_pem_key(self, pem_key_location):
    """ Checks to see if the pem key specified exists
    :param pem_key_location: (str) path to the pem key file check_pem_key("~/path/to/key.pem")
    """ 
    if not isfile(pem_key_location): 
        error_string = "pem key doesn't exist! Please specify the pem key location using the pem_key keyword argument"
        raise ValueError(error_string)
    else:
        pass
```

### Cluster Check:

This method checks to see if a cluster, by the same name
(cluster_name keyword argument), is already running.

```
 def check_cluster_exists(self, cluster_name):
    """ Check to see if the cluster already exists and is available
    :param cluster_name: (str) name of the cluster as it appears in the AWS EMR Console
    """
    # get a list of all clusters in an 'operational' state
    # this is the list of clusters on the account in the specified region
    list_of_clusters = self.aws_connection.list_clusters( cluster_states=["STARTING", "RUNNING", "WAITING", "BOOTSTRAPPING"])
    cluster_list_names = [cluster.name for cluster in list_of_clusters]
    # gather a list of cluster names
    
    if cluster_name in cluster_list_names:
        self.cluster_exists = True
        self.load_cluster(cluster_name) # if the cluster exists, go ahead and use it
    else:
    self.cluster_exists = False
    print "No cluster by the name [{}] is currently running".format(cluster_name)
    print "Creating one. It must be started with the START_CLUSTER mentod" 
 
```

### Load Existing Cluster:

This method is used to connect to an existing cluster.  If the a cluster with the
same name is currently running, the object will connect to that cluster
instead of starting a new one.

```
def load_cluster(self, cluster_name):
    """ Load the cluster with the input name
    :param cluster_name: (str) name of the cluster as it appears in the AWS EMR Console
    """
    
    list_of_clusters = self.aws_connection.list_clusters(
            cluster_states=["STARTING", "RUNNING", "WAITING", "BOOTSTRAPPING"]) for clstr, cluster in enumerate(list_of_clusters.clusters):
        if str(cluster.name) == cluster_name:
            self.cluster_id = cluster.id
            self.cluster_dns = self.get_cluster_dns()
            # self.cluster_ssh = self.get_cluster_ssh()
        else:
            continue
```

### Set Instances:

This method compiles the specified attributes into a set of ec2 instances for the EMR
cluster.  Here I establish master and core nodes but not task nodes.  These
can be easily added if need be.

```
 def set_instance_group(self):
    """ Set the parameters for the master and core nodes Task nodes can
    be added by following the same format and setting the role to "TASK"
    """
    self.instance_group = []
    self.instance_group.append(InstanceGroup( num_instances = self.master_number_nodes,
            role = self.master_node_role,
            type = self.master_instance_type,
            market = self.cluster_market,
            name = self.master_node_name,
            bidprice = self.cluster_spot_price
            ))
    
    self.instance_group.append(InstanceGroup( num_instances = self.core_number_nodes, role = self.core_node_role, type = self.core_instance_type, market = self.cluster_market, name = self.core_node_name, bidprice = self.cluster_spot_price )) 
```

### Set Steps:

This method compiles a list of bootstrapping actions and steps.  Here,
the default bootstrapping action includes installing Impala and the default
step includes installing hive.  More steps can be added to install other
software packages, edit cluster parameters, run bash scripts and even
perform MapReduce stream jobs.  For some details check out the boto documentation
here. I will make another post demonstrating a step to increase the MapReduce heap size.

```
 def set_cluster_steps(self):
    """ Creates a list of bootstrap actions and a list of steps
    The default steps here install impala and hive. More steps can be appened to the list
    """
    
    self.cluster_bootstrap_steps = []
    self.cluster_steps = []
    self.cluster_install_impala_step = boto.emr.BootstrapAction("Install Impala",
                "s3://elasticmapreduce/libs/impala/setup-impala",
                ["--base-path","s3://elasticmapreduce","--impala-version",
                self.cluster_impala_version]
                )
    
    self.cluster_bootstrap_steps.append(self.cluster_install_impala_step)
    self.hive_install_step = boto.emr.step.InstallHiveStep(hive_versions = self.cluster_hive_version)
    self.cluster_steps.append(self.hive_install_step)
 
```

### Start Cluster:

This method starts the cluster.  If a cluster by the same name exists, this method is bypassed.
```
 def start_cluster(self):
    """ Initiate the cluster.
    """
    if self.cluster_exists is False: # if the cluster doesn't already exist, request one
        print "\nPlease Wait while a cluster is being provisioned..."
        self.cluster_id = self.aws_connection.run_jobflow( self.cluster_name,
                    instance_groups = self.instance_group,
                    action_on_failure = self.cluster_action_on_failure,
                    keep_alive = self.cluster_keep_alive,
                    enable_debugging = self.cluster_enable_debugging,
                    log_uri = self.cluster_log_location,
                    hadoop_version = self.cluster_hadoop_version,
                    availability_zone = self.cluster_zone,
                    ami_version = self.cluster_ami_version,
                    steps = self.cluster_steps ,#boto.emr.step.InstallHiveStep(hive_versions="latest"),
                    bootstrap_actions=self.cluster_bootstrap_steps,
                    ec2_keyname = self.cluster_ec2_keyname, # need to figure this out visible_to_all_users=True
                    ) 
        # Add tags
        self.aws_connection.add_tags(self.cluster_id, self.cluster_tags)
    else: # if the cluster already exists, do nothing 
        pass
 ```
 
### Establish AWS Connection:

This method establishes an AWS connection, in the specified region.

```
def get_connection(self):
    """ Establish a connection with S3 """
    self.aws_connection = boto.emr.connect_to_region(self.cluster_region) # connection to EMR
```

### Obtain Cluster Status:

This method grabs the current status of the cluster and returns it as a
string.  The possible values for the cluster's state can be found
[here](http://docs.aws.amazon.com/ElasticMapReduce/latest/DeveloperGuide/ProcessingCycle.html).

```
 def get_cluster_status(self):
    """ Get the current status of the running cluster :return: (str) current cluster status status """
    try:
        status = str(self.aws_connection.describe_jobflow(self.cluster_id).state)
        return status
    except:
        pass
 ```
 
### Obtain Cluster DNS:
 
This method grabs the cluster's master DNS if it is available.  If the DNS
is not available (cluster is still being provisioned) this method will
wait until it is.  The master DNS is returned as a string.

```
def get_cluster_dns(self):
    """ Get the cluster's MASTER PUBLIC DNS :return: (str) cluster's master DNS """
    printout = 0
    if self.cluster_dns == "":
        # if the dns is not available, continue polling until it's available
        while self.cluster_dns == "":
            try:
                self.cluster_dns = str(self.aws_connection.describe_cluster(self.cluster_id).__dict__['masterpublicdnsname'])
                return self.cluster_dns
            except:
                if printout == 0:
                    print "Waiting for DNS to become available..."
                    printout = 1 time.sleep(1)
    else:
        # if the cluster is already up and running, grab its dns
        self.cluster_dns = str(self.aws_connection.describe_cluster(self.cluster_id).__dict__['masterpublicdnsname'])
        return self.cluster_dns
```

### Establish Cluster SSH Connection:

This method establishes a SSH connection with the cluster.  It calls
the get_cluster_dns method to obtain the master DNS.  A SSH Client
object is returned and a list of available methods can be
found [here](http://boto.readthedocs.org/en/latest/ref/manage.html) under cmdShell.

```
def get_cluster_ssh(self):
        """
        This will create a SSH client object with a connection to the cluster's master instance
        Refer to http://boto.readthedocs.org/en/latest/ref/manage.html?highlight=ssh#boto.manage.cmdshell.SSHClient
        for all possible methods on the ssh client object
        :param ssh_script: Self
        :return: a boto ssh client object
        """
        printout = 0

        if self.cluster_dns == "":
            while self.cluster_dns == "":

                try:
                	# if the dns doesn't exist, go grab it
                    self.get_cluster_dns() 

                    instance = self.aws_connection.list_instances(self.cluster_id).instances
                    # find the master instance out of all cluster instances
                    for inst in instance:
                        if inst.publicdnsname == self.cluster_dns: 
                            master_instance = inst
                            break
                        else:
                            continue
					# this is a hack, for some reason boto cmdshell looks for a nonexistant dns_name attribute
                    master_instance.dns_name = master_instance.publicdnsname 

                    ssh_client = sshclient_from_instance(master_instance, ssh_key_file = self.pem_key,
                                                   user_name = "hadoop", ssh_pwd = None) # establish the ssh connection
                    return ssh_client
                except:

                    if printout == 0:
                        print "Waiting for DNS to become available..."
                        printout = 1

                    time.sleep(1)

        else:
        	# if the dns exists, grab the master dns and establish a connection
            instance = self.aws_connection.list_instances(self.cluster_id).instances 

            for inst in instance:
                if inst.publicdnsname == self.cluster_dns:
                    master_instance = inst
                    break
                else:
                    continue

            master_instance.dns_name = master_instance.publicdnsname # this is a hack, for some reason boto cmdshell looks for this attribute

            ssh_client = sshclient_from_instance(master_instance, ssh_key_file = self.pem_key,
                                           user_name = "hadoop", ssh_pwd = None)
            return ssh_client
 ```

### Terminate Cluster:

This method terminates the cluster.

```
def kill_cluster(self):
    """
    Terminate the cluster once started.
    """
    try:
        self.aws_connection.terminate_jobflow(self.cluster_id)
        print "Terminating Cluster, please wait..."
        time.sleep(5)
        print "Cluster Status: {}".format(str(self.get_cluster_status()))
    except:
        print "Cluster Not Terminated (was one even started?)"
```

### Self Test:

The self test is called in `__main__` to ensure the class works properly.  This is also a good
example of how this class should be used.  A cluster (1 master and 1 core node) is
requested.  Once the cluster has been provisioned, a test directory is created in the home
directory.  Once the existence of the test directory has been verified, the cluster is terminated.

```
def self_test():
    """
    Instantiates a cluster and starts a self test
        1. start the cluster
        2. when it's started, ssh and make a test directory
        3. check to see if that directory was indeed created
        4. terminate cluster
    :return:
    """

    print "initiating cluster class self test..."

    test = emr_cluster(num_core_nodes=1)
    test.start_cluster()

    cluster_status = test.get_cluster_status()

    while cluster_status != "WAITING":
        time.sleep(10)
        cluster_status = test.get_cluster_status()
        if cluster_status in ["SHUTTING_DOWN","TERMINATED"]:
            print "Cluster is unexpectedly terminating. Please consult AWS EMR Console."

    test.cluster_ssh = test.get_cluster_ssh()
    test.cluster_ssh.run("mkdir /home/hadoop/testdir")[1] # run command and return stdout
    directoryCheck = test.cluster_ssh.run("ls")[1].split("\n")

    if "testdir" in directoryCheck:
        print "Self test successful. Terminating Cluster, please wait"
        test.kill_cluster()
        
        cluster_status = test.get_cluster_status()
        
        while cluster_status != "TERMINATED":
            cluster_status = test.get_cluster_status()
            time.sleep(5)


    else:
        print "Self test failed! \nThe {} cluster will remain active for investigation".format(test.cluster_name)
        print "\nCluster must be terminated manually."
```


I hope this helps.  If there are any questions or issues, please let me know.