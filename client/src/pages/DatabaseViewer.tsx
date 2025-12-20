
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface TableData {
  name: string;
  rows: any[];
  columns: string[];
}

export default function DatabaseViewer() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');

  useEffect(() => {
    fetchAllTables();
  }, []);

  const fetchAllTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database/tables');
      const data = await response.json();
      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0].name);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTable = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/database/table/${tableName}`);
      const data = await response.json();
      setTables(prev => prev.map(table => 
        table.name === tableName ? data : table
      ));
    } catch (error) {
      console.error('Error refreshing table:', error);
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null) return <Badge variant="secondary">NULL</Badge>;
    if (typeof value === 'boolean') return <Badge variant={value ? "default" : "destructive"}>{String(value)}</Badge>;
    if (typeof value === 'object') return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
    if (String(value).length > 100) return <span className="text-xs">{String(value).substring(0, 100)}...</span>;
    return String(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading database tables...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Database Viewer</h1>
        <p className="text-gray-600">View raw data from your SQLite database</p>
      </div>

      <Tabs value={selectedTable} onValueChange={setSelectedTable}>
        <TabsList className="mb-4">
          {tables.map((table) => (
            <TabsTrigger key={table.name} value={table.name}>
              {table.name} ({table.rows.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {tables.map((table) => (
          <TabsContent key={table.name} value={table.name}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Table: {table.name}</CardTitle>
                <Button 
                  onClick={() => refreshTable(table.name)}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant="outline">Rows: {table.rows.length}</Badge>
                  <Badge variant="outline" className="ml-2">Columns: {table.columns.length}</Badge>
                </div>
                
                {table.rows.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No data in this table</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.columns.map((column) => (
                            <TableHead key={column} className="font-medium">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.rows.map((row, index) => (
                          <TableRow key={index}>
                            {table.columns.map((column) => (
                              <TableCell key={column} className="max-w-xs">
                                {formatCellValue(row[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
