class CreateCollection:
    def __init__(self, connector, table_name: str, columns):
        self.connector = connector
        self.table_name = table_name
        self.columns = columns
        self.create()

    def create(self):
        if type(self.columns) is not list:
            return
        conn = self.connector()
        cursor = conn.cursor()

        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS {self.table_name} (
                {",".join(self.columns)}
            )
        ''')
        conn.commit()

        cursor.close()
        conn.close()

class TableCollection:
    def __init__(self, connector, table_name: str):
        self.connector = connector
        self.table_name = table_name
        self.valid = True

        conn = self.connector()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
            result = cursor.fetchone()
            if not result:
                self.valid = False
        except:
            self.valid = False

        cursor.close()
        conn.close()

    def getTableColumns(self, table_name: str):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()

        cursor.execute(f"PRAGMA table_info({table_name})")

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return rows

    def insertOne(self, data):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()

        columns = self.getTableColumns(self.table_name)
        cols = []
        cols_ques = []
        vals = []
        valid = True
        for column in columns:
            column_name = column[1]
            is_required = True if column[3] == 1 else False

            if is_required:
                try:
                    vals.append(str(data[column_name]))
                    cols.append(column_name)
                    cols_ques.append("?")
                except:
                    print(f"Is required {column_name}")
                    valid = False
            else:
                try:
                    vals.append(str(data[column_name]))
                    cols.append(column_name)
                    cols_ques.append("?")
                except:
                    pass

        str_cols = ",".join(cols)
        str_cols_ques = ",".join(cols_ques)

        if valid:
            cursor.execute(f'''
                INSERT INTO {self.table_name} ({str_cols})
                VALUES ({str_cols_ques})
            ''', (vals))
        else:
            return False

        user_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return self.getMany({"id":user_id})

    def updateOne(self, query, data):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()
        columns = self.getTableColumns(self.table_name)

        cols_query = []
        vals_query = []
        for column in columns:
            column_name = column[1]
            try:
                vals_query.append(str(query[column_name]))
                cols_query.append(f'{column_name} COLLATE NOCASE = ?')
            except:
                pass

        cols = []
        vals = []
        for column in columns:
            column_name = column[1]
            try:
                vals.append(str(data[column_name]))
                cols.append(f'{column_name} = ?')
            except:
                pass

        str_cols_query = " AND ".join(cols_query)
        str_cols = ", ".join(cols)

        try:
            cursor.execute(f'''
                UPDATE {self.table_name} SET {str_cols} WHERE {str_cols_query}
            ''', (vals + vals_query))
        except:
            return False

        conn.commit()
        conn.close()

        return True

    def deleteOne(self, query):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()
        columns = self.getTableColumns(self.table_name)

        cols_query = []
        vals_query = []
        for column in columns:
            column_name = column[1]
            try:
                vals_query.append(str(query[column_name]))
                cols_query.append(f'{column_name} COLLATE NOCASE = ?')
            except:
                pass

        str_cols_query = " AND ".join(cols_query)
        try:
            cursor.execute(f'''
                DELETE FROM {self.table_name} WHERE {str_cols_query}
            ''', (vals_query))
        except:
            return False

        conn.commit()
        conn.close()

        return True

    def deleteMany(self, query):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()
        columns = self.getTableColumns(self.table_name)

        cols_query = []
        vals_query = []
        for column in columns:
            column_name = column[1]
            try:
                vals_query.append(str(query[column_name]))
                cols_query.append(f'{column_name} COLLATE NOCASE = ?')
            except:
                pass

        str_cols_query = " AND ".join(cols_query)
        try:
            cursor.execute(f'''
                DELETE FROM {self.table_name} WHERE {str_cols_query}
            ''', (vals_query))
        except:
            return False

        conn.commit()
        conn.close()

        return True

    def getMany(self, query):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()
        columns = self.getTableColumns(self.table_name)

        columnNames = []

        for column in columns:
            columnNames.append(column[1])

        cols_query = []
        vals_query = []
        for column in columns:
            column_name = column[1]
            try:
                vals_query.append(str(query[column_name]))
                cols_query.append(f'{column_name} COLLATE NOCASE = ?')
            except:
                pass

        str_cols_query = " AND ".join(cols_query)
        cursor.execute(f'''
            SELECT * FROM {self.table_name} WHERE {str_cols_query}
        ''', (vals_query))

        results = cursor.fetchall()

        conn.commit()
        conn.close()

        if len(results) > 0:
            data_array = []
            for row in results:
                data = {}
                for i in range(len(columnNames)):
                    data[columnNames[i]] = row[i]
                data_array.append(data)
            return data_array
        else:
            return []

    def getAll(self):
        if not self.valid:
            return

        conn = self.connector()
        cursor = conn.cursor()
        columns = self.getTableColumns(self.table_name)

        columnNames = []

        for column in columns:
            columnNames.append(column[1])

        cursor.execute(f'''
            SELECT * FROM {self.table_name}
        ''')

        results = cursor.fetchall()

        conn.commit()
        conn.close()
        if len(results) > 0:
            data_array = []
            for row in results:
                data = {}
                for i in range(len(columnNames)):
                    data[columnNames[i]] = row[i]
                data_array.append(data)
            return data_array
        else:
            return []
