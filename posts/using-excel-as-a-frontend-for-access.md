title: Using MS Excel as a Frontend for MS Access
slug: excel-frontend-for-access
date: 2016-10-01 20:45:49 UTC-04:00
tags: ms access, ms excel
category:
link:
description:
type: text

A lot of people may ask the question 'Why would you want to use Excel as a UI for an
Access Database?'.  And they're right to ask since there are many other tools out
there better suited for creating a UI let alone better database tools.  That being
said, sometimes this is just what you need/want to do...so here's how you do it.

<!-- TEASER_END -->

TL;DR - Scroll to the end for the complete code

### Setup

**Assumptions:** Excel/Access 2010+ (written on Excel/Access 2010 but will probably
work for later versions), you know how to add buttons and develop a macro in Excel.

To walk through an example we first need an Access database as well as and Excel
UI.  While the possibilities are endless in regards to how complicated you want
to make your database/UI, here is the setup for this example:

*Example Access DB (Database1.accdb):*

<img src="/images/excel-front-end/db-example.jpg">

*Example Excel UI:*

<img src="/images/excel-front-end/excel-ui.jpg">

**Variable Declaration and Inputs**
```
Private Sub CommandButton1_Click()
' Disable the screen flicker
Application.ScreenUpdating = False

' DECLARE &amp;nbsp;VARIABLES
Dim access_db_path As String
Dim access_db_name As String
Dim target_db As String
Dim tableName As String
Dim input_field As String
Dim conn As Object
Dim rs As Object
Dim strConnection As String
Dim Query As String

' SET UP INPUT PARAMETERS
' Get the name to look up
input_field = ActiveSheet.Range("F4").Value

' Grab the Workbook's path (assuming it's the same as the DB)
access_db_path = Application.ActiveWorkbook.Path
' IF NOT IN THE SAME LOCATION AS EXCEL FILE USE SOMETHING LIKE - "C:\path\to"

access_db_name = "Database1.accdb"
target_db = access_db_path &amp;amp; "\" &amp;amp; access_db_name
tableName = "Table1"
```

This is pretty straight forward but the major things to grasp here are
the input_field, target_db, and table_name. The input_field is cell F4
in the UI image and it is where the user will input the search parameter
(in this case someone's name).  The target_db variable is the path to
the Access database file (.accdb).  Here, I make the assumption that the
Excel file and the database file are collocated, but if they are not
(which is more likely) then you will need to specify the path to the
directory containing the file.  Finally, the table_name variable is just
that, the name of the table to access in the database.

**Query The Database**
We can use SQL to query the database and to do that we generate a string
of the query we want to execute:

```
&lt;pre&gt;' QUERY TO GRAB DATA FROM DATABASE
Query = "SELECT Coolness, Color from " &amp;amp; table_name &amp;amp; " WHERE Name ='" &amp;amp; input_field &amp;amp; "';"
Debug.Print Query&lt;/pre&gt;
```

Here we are grabbing the Coolness Factor (Coolness) and Favorite Color
(Color ) associated with the input name.  The Debug line allows us to
see the resulting query printed in the Immediate window in the VB editor
to ensure the syntax is correct.

Next we setup or connection to the database:

```
' SETUP CONNECTION TO THE ACCESS DATABASE
Set conn = CreateObject("ADODB.Connection")
strConnection = "Provider=Microsoft.ACE.OLEDB.12.0;data source=" &amp;amp; target_db &amp;amp; ";"
' Open the connection to the DB
conn.Open strConnection
```

To make a connection to the database, we need to instantiate an ActiveX
Data Object (ADO) object and provide it with the driver to be used
(Provider=Microsoft.ACE.OLEDB.12.0) and the database to which we want
to connect (target_db).  Once the connection object has been created
and opened, we can execute our query:

```
' EXECUTE THE SQL QUERY
Set rs = conn.Execute(Query)

' Error handling for when a search input does not exist in the DB
If rs.EOF Or rs.BOF Then
MsgBox "There are no records in the database!", vbCritical, "No Records"
Else
' OUTPUT THE VALUE TO THE CURRENT SHEET
ActiveSheet.Range("F7").Value = rs.Fields(0)
ActiveSheet.Range("F10").Value = rs.Fields(1)
End If

' CLOSE THE CONNECTIONS TO ACCESS AND THE RECORDSET
rs.Close
Set rs = Nothing
conn.Close
```

Here we see that we can execute the query and capture the returned
recordset.  At this point, we do a bit of error handling which will
cause a message box to pop up indicating that the input parameter
does not exist in the database. (additional error handling may/should
be added as well)

Once the query has executed successfully, we have only to assign the
results to appear in the Excel UI by assigning cell values to the
appropriate returned value (rs.Fields(#)) before closing the connection.
Note that the fields are 0 indexed.

One last thing. We need to re-enable the screen update:
```
' Re-enable the screen updating
Application.ScreenUpdating = False
End Sub
```

**The Result**

Here is what the result looks like:

<img src="/images/excel-front-end/anne_result.jpg">
<img src="/images/excel-front-end/brenton_result.jpg">

There's a lot more that can be done here to suite whatever needs
you may have, but this is a starting point.

Thanks for reading, I hope this was useful for ya!

**TL;DR - The Code:**

```
Private Sub CommandButton1_Click()
' Disable the screen flicker
Application.ScreenUpdating = False

' DECLARE &amp;nbsp;VARIABLES
Dim access_db_path As String
Dim access_db_name As String
Dim target_db As String
Dim tableName As String
Dim input_field As String
Dim conn As Object
Dim rs As Object
Dim strConnection As String
Dim Query As String

' SET UP INPUT PARAMETERS
' Get the name to look up
input_field = ActiveSheet.Range("F4").Value

' Grab the Workbook's path (assuming it's the same as the DB)
access_db_path = Application.ActiveWorkbook.Path
' IF NOT IN THE SAME LOCATION AS EXCEL FILE USE SOMETHING LIKE - "C:\path\to"

access_db_name = "Database1.accdb"
target_db = access_db_path &amp;amp; "\" &amp;amp; access_db_name
tableName = "Table1"

&lt;pre&gt;' QUERY TO GRAB DATA FROM DATABASE
Query = "SELECT Coolness, Color from " &amp;amp; table_name &amp;amp; " WHERE Name ='" &amp;amp; input_field &amp;amp; "';"
Debug.Print Query&lt;/pre&gt;

' SETUP CONNECTION TO THE ACCESS DATABASE
Set conn = CreateObject("ADODB.Connection")
strConnection = "Provider=Microsoft.ACE.OLEDB.12.0;data source=" &amp;amp; target_db &amp;amp; ";"
' Open the connection to the DB
conn.Open strConnection

' EXECUTE THE SQL QUERY
Set rs = conn.Execute(Query)

' Error handling for when a search input does not exist in the DB
If rs.EOF Or rs.BOF Then
MsgBox "There are no records in the database!", vbCritical, "No Records"
Else
' OUTPUT THE VALUE TO THE CURRENT SHEET
ActiveSheet.Range("F7").Value = rs.Fields(0)
ActiveSheet.Range("F10").Value = rs.Fields(1)
End If

' CLOSE THE CONNECTIONS TO ACCESS AND THE RECORDSET
rs.Close
Set rs = Nothing
conn.Close

' Re-enable the screen updating
Application.ScreenUpdating = False
End Sub
```
