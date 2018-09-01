title: Adding Multiple Global Secondary Indexes to a DynamoDB Table in CloudFormation
slug: multiple-secondary-indexes
date: 2017-12-20 17:22:18 UTC-04:00
tags: python,aws,cloud formation,dynamodb
category: aws
link: 
description: 
type: text

So, you've decided to use AWS CloudFormation to make your stack
reproducible, iterable and integrate it into a CI/CD pipeline (maybe
using CloudPipeline?).  Your stack uses DynamoDB tables and, in order to
increase efficiency (or other reasons), you've decided to use [Global
Secondary
Indexes](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
(GSIs).  You can define the table and a single GSI in the CloudFormation
template file, but issues arise when you need multiple indexes. 

<!-- TEASER_END -->

The main issue is that DynamoDB creations or updates happen asynchronously but
can only execute serially (at least at the time of writing this).  In
other words, an update will be initiated and the following one cannot
execute until the first has completed.  If a second update is attempted
before the first can complete, an exception will be raised. The obvious
way around this is to execute the first update and then execute the
following update after the table has reached an appropriate state via
either the AWS console or the aws-cli (The available states: *CREATING*,
*UPDATING*, *DELETING*, *ACTIVE*).  This becomes an issue when dealing
with programmatic creation and updating through CloudFormation. 
Manually monitoring the console or polling via the aws-cli defeats the
purpose of the automated deployment gained by using CloudFormation.
Enter [Custom
Resources](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cfn-customresource.html). 
Let's take a look at an example. **Notes**:

-   All the code from the following example can be found
    [here](https://github.com/brentonmallen1/cloudformation_multiple_gsi).
-   To minimize environment packaging requirements, all of this code
    uses libraries accessible to the Lambda instance (e.g. python 3.6
    standard library, boto3)

CloudFormation
--------------

The following example of a [CloudFormation
template](https://github.com/brentonmallen1/cloudformation_multiple_gsi/blob/master/multiple_gsi_cf_template.yml)
(yaml) file describes a DynamoDB table, a Lambda function and a Custom
Resource.

    AWSTemplateFormatVersion: 2010-09-09
    Transform: 'AWS::Serverless-2016-10-31'
    Description: DynamoDB Multiple GSI Custom Resource Demo
    Resources:
      DynamoTable:
        Type: 'AWS::DynamoDB::Table'
        Properties:
          AttributeDefinitions:
            - AttributeName: primary
              AttributeType: 'N'
          KeySchema:
            - AttributeName: primary
              KeyType: HASH
          ProvisionedThroughput:
            ReadCapacityUnits: 5
            WriteCapacityUnits: 5
      DynamoGSILambda:
        DependsOn: DynamoTable
        Type: 'AWS::Serverless::Function'
        Properties:
          Handler: add_gsi.lambda_handler
          Runtime: python3.6
          CodeUri: .
          Description: add multiple global secondary indexes to the dynamo table
          MemorySize: 128
          Timeout: 300
          Role: ''
          # Define event source mapping below
          Environment:
            Variables:
              logging_level: INFO
              TABLE_NAME: !Ref DynamoTable
              GSI_1: global-secondary-index-1
              GSI_2: global-secondary-index-2
          Tags:
            tag1: noblesse
            tag2: oblige

      DynamoGSICustom:
        Type: "Custom::AddMultipleDynamoGSIs"
        Version: "1701"
        Properties:
        ServiceToken: !GetAtt DynamoGSILambda.Arn

**Note**: the *Role* value should be the Arn for the AWS IAM role to be
associated with the lambda function. This template specifies the
following:

-   a DynamoDB table
    -   Called **DynamoTable**
    -   Has a primary key called **primary**
-   a Lambda function
    -   Called **DynamoGSILambda**
    -   A python 3.6 environment
        -   The *Handler* points to the main method in the python code
        -   The *CodeUri* points to the code directory
    -   A 300 second timeout (max timeout)
    -   Environment variables that specify
        -   The logging level
        -   The name of the table to which you want to add the GSIs
        -   The names of GSIs to be added
-   a custom resource
    -   Called **DynamoGSICustom**
    -   *Type* can be a custom string
    -   *Version* can be custom
    -   *ServiceToken* points to Lambda function ARN

Lambda
------

Without going into every detail, let's take a quick look at the
components of the Lambda function,
*[add\_gsi.py](https://github.com/brentonmallen1/cloudformation_multiple_gsi/blob/master/add_gsi.py).*

#### *lambda\_handler*

It has the following main *lambda\_handler* method that gets executed
when invoked by Lambda:

    def lambda_handler(event, context):
        """Lambda Function to Update Table with GSIs
        Update specified (via environment variables) table with GSIs
        Args:
            event: Lambda Event object
            context: Lambda Context object
        Returns:
            N/A
        """
        # GSI 1
        table_active_wait(TABLE_NAME)
        create_gsi_1(context)

        # GSI 2
        table_active_wait(TABLE_NAME)
        create_gsi_2(context)

        # send success message
        table_active_wait(TABLE_NAME)
        try:
            send_response(context, event, status='SUCCESS')
        except:
            send_response(context, event, status='FAILURE')

The *lambda\_handler* method follows a simple procedure of waiting for
the table to reach and ACTIVE state and follow that with an attempt to
create the GSI.  This pattern is repeated for each GSI (clearly a place
for abstraction if dealing with a large number of GSIs). **Note**: The
final *table\_active\_wait* before sending the response is there to make
sure that the table is in an ACTIVE state before telling CloudFormation
that the resource has completed.

#### *table\_active\_wait*

    def table_active_wait(table_name: str, wait_seconds: int=15):
        """Wait for table and its GSIs to be active
        Poll dynamo table status and wait for it to have a state of ACTIVE.
        The wait time between iterations is an increasing backoff.
        Args:
            table_name: name of the dynamo table for which we want a status check
            wait_seconds: number of seconds to wait in between pollings
        Returns: N/A
        """
        table_active = False
        retry = 0

        while not table_active:
            if retry > wait_seconds:
                retry = wait_seconds
            exp_wait = math.floor(wait_seconds ** (retry / wait_seconds))
            logger.debug(f"Table [{table_name}] not active, waiting [{exp_wait}] seconds to poll again")
            time.sleep(exp_wait)
            table_active = check_table_status(table_name)
            logger.debug(table_active)
            retry += 1
        logger.debug(f"Table [{table_name}] is active")

        # check that the GSIs are all active
        gsi_active = False
        retry = 0
        while not gsi_active:
            if retry > wait_seconds:
                retry = wait_seconds
            exp_wait = math.floor(wait_seconds ** (retry / wait_seconds))
            logger.debug(f"Table [{table_name}] GSIs not active, waiting [{exp_wait}] seconds to poll again")
            time.sleep(exp_wait)
            gsi_active = check_gsi_status(table_name)
            logger.debug(gsi_active)
            retry += 1
        logger.debug(f"Table [{table_name}] GSIs are active")
        return

This function polls for the specified table's status as well as said
table's GSI(s) status(es) and waits for each to reach an ACTIVE state. 
This is important because the states for each are, for the purposes
here, independent and they both need to be checked. The wait increases
which allows for more time in between each subsequent status poll, but
doesn't go over the specified max time (in seconds).

#### *function\_retry*

    def function_retry(fn,):
        """Function retry wrapper
            
            This is used as a decorator to retry a function a set number of times with a set wait period between
            executions.
        Args:
            fn: wrapped function
            num_retries: number of times to retry function
            wait_seconds: number of seconds to wait in between function calls
        Returns:
            wrapper: The wrapped function
        """

        def wrapper(context, *args, num_retries=5, wait_seconds=30, **kwargs):
            retry = 0
            while retry <= num_retries:
                if context.get_remaining_time_in_millis() <= 10000:
                    raise Exception('Function was about to timeout')
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                logger.debug(f"Retrying function [{fn.__name__}] after waiting [{wait_seconds}] seconds.")
                logger.debug(f"Retries remaining: [{num_retries - retry}]")
                logger.debug(f"Retry caused by: {e}")
                if 'already exists' in str(e):
                    logger.info(f'GSI Already created for {fn.__name__}')
                    return
                time.sleep(wait_seconds)
                retry += 1
                if retry > num_retries:
                    logger.info(f"{fn.__name__} failed after {num_retries} retries")
            return wrapper

This decorator is used to retry a function (specifically the adding of a
GSI) if the attempt should fail and it is in place for a couple of
reasons.  First it is for redundancy and the second reason is to catch
the condition where the GSI already exists.  This condition can be met
if not all GSIs were added before the function times out and has rerun.

#### create\_gsi\_\#

    @function_retry
    def create_gsi_1():
        """Create GSI 1
        Creates the Global Secondary Indexes for GSI 1
        in DynamoDB.
        Returns:
            N/A
        """
        try:
            logger.info("ADDING GSI 1")
            response = client.update_table(
                AttributeDefinitions=[
                    {
                        'AttributeName': 'primary',
                        'AttributeType': 'N'
                    },
                    {
                        'AttributeName': 'gsikey',
                        'AttributeType': 'N'
                    },
                ],
                TableName=TABLE_NAME,
                GlobalSecondaryIndexUpdates=[{
                    'Create': {
                                  'IndexName': GSI_1,
                                  'KeySchema': [
                                      {
                                          'AttributeName': 'gsikey',
                                          'KeyType': 'HASH'
                                      },
                                  ],
                                  'Projection': {
                                      'ProjectionType': 'INCLUDE',
                                      'NonKeyAttributes': [
                                          'primary'
                                      ]
                                  },
                                  'ProvisionedThroughput': {
                                      'ReadCapacityUnits': 5,
                                      'WriteCapacityUnits': 5
                                  }
                              }
                }
                ]
            )
            logger.info(f"GSI 1 added!")
        except Exception as e:
            raise e
            logger.debug(f"Failed to add GSI 1\n{e}")

This function updates a Dynamo table with a GSI.  It is decorated with
the *function\_retry* decorator described above.  It is important to
note that an error must be raised in order for the decorator to be aware
of it, hence the exception.  It's also worth noting that this function
could be abstracted if there are a number of similar GSIs to be added.

#### *send\_response*

    def send_response(context, event, status: str='SUCCESS', reason: str=None):
        """ Send status response to Cloud Formation
            
            Send a status message to Cloud Formation to let it know if the lambda function completed successfully
        Args:
            context: Lambda context object
            event: Lambda event object
            status: 'SUCCESS' or 'FAILURE' to discribe the state
            reason: reason for failure
        Returns:
            Sends a message to the pre-signed URL to indicate the state of the lambda execution
        """

        if not reason:
            reason = f"See the details in CloudWatch Log Stream: {context.log_stream_name}"
        response_body = json.dumps(
            {
                'Status': status,
                'Reason': reason,
                'PhysicalResourceId': context.log_stream_name,
                'StackId': event['StackId'],
                'RequestId': event['RequestId'],
                'LogicalResourceId': event['LogicalResourceId']
            }
        )
        encoded_body = response_body.encode()
        logger.info(f"Response: {response_body}")
        request = urllib.request.Request(url=event['ResponseURL'],
                                         method='PUT',
                                         data=encoded_body,
                                         headers={
                                             "content-type": "",
                                             "content-length": len(encoded_body)
                                         }
                                         )
        logger.info(f'Response Request: {request.__dict__}')
        logger.info('Sending status response...')
        try:
            urllib.request.urlopen(request)
            logger.info('Status response sent!')
        except Exception as e:
            logger.exception(f'Failed to send status response:\n{e}')

This function is responsible for sending the SUCCESS or FAILURE message
back to CloudFormation.  A  POST request is sent to a pre-signed URL
with the appropriate [status
message](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-responses.html)
to denote the status of the Custom Resource. **Note:** If this message
is not sent, you can get stuck waiting for a 1 hour timeout before the
stack fails!

### In Closing (TL;DR)

Full code can be found
[here](https://github.com/brentonmallen1/cloudformation_multiple_gsi). 
After
[packaging](http://docs.aws.amazon.com/cli/latest/reference/cloudformation/package.html)
and
[deploying](http://docs.aws.amazon.com/cli/latest/reference/cloudformation/deploy/index.html)
the template, the Custom Resource will execute the specified Lambda
function.  The Lambda function will attempt to add the GSI while waiting
on the table and index statuses.  Once the GSIs are successfully added,
the function sends a SUCCESS message to CloudFormation and the Custom
Resource is removed. Hopefully this was helpful. If it was or if you
have any questions please don't hesitate to reach out to me.
