.. title: Increase MapReduce Heap Size Using Boto
.. slug: marpreduce-heap-size
.. date: 2015-07-25 16:25:36 UTC-04:00
.. tags: aws
.. category:
.. link:
.. description:
.. type: text

You might find yourself needing to increase the maximum memory available for MapReduce
jobs in AWS.  This could be because you received a 143 exit code or for some other
reason.  To increase the heap size in boto, you can add the following Bootstrap Action
to the cluster:

**Verions:** `boto 2.38.0 <https://github.com/boto/boto>`_, python 2.7

::

    # Specify the heap size in MB
    clusterHeapMB = 4000
    # Add this to the list of Bootstrap Actions
    increaseHeapStep = boto.emr.BootstrapAction("Increase Heap",
            "s3://elasticmapreduce/bootstrap-actions/configure-hadoop",
             ["-m","mapred.child.java.opts=-Xmx{}m".format(clusterHeapMB)])



