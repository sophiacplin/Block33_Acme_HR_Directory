const express = require('express')
const app = express()
const pg = require('pg')
const  client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_departments_employees_db')
const PORT = process.env.PORT||'3000'
app.use(express.json())
app.use(require('morgan')('dev'))

//get to departments
app.get('/api/departments', async(req, res, next) => {
  try{
    const SQL = `
    SELECT * FROM departments;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  }catch(err){
    next(err)
  }
});

//get to employees
app.get('/api/employees', async(req, res, next) => {
  try{
    const SQL = `
    SELECT * FROM employees;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  }catch(err){
    next(err)
  }
});

//post to employees
app.post('/api/employees', async(req, res, next) => {
  try{
    const body = req.body
    const name = body.name
    const department_id = body.department_id
    const SQL = `
    INSERT INTO employees(name, department_id)
    VALUES($1, (SELECT id FROM departments WHERE name = $2))
    RETURNING *;
    `
    const response = await client.query(SQL, [name, department_id])
    res.send(response.rows[0])
  }catch(err){
    next(err)
  }
});

//update employee
app.put('/api/employees/:id', async(req, res, next) => {
  try{
    const body = req.body
    const name = body.name
    const departmentId = body.department_id
    const id = req.params.id
    const SQL = `
    UPDATE employees
    SET name = $1, department_id = (SELECT id FROM departments WHERE name = $2)
    WHERE id = $3
    RETURNING *
    `
    const response = await client.query(SQL, [name, departmentId, id])
    res.send(response.rows[0])
  }catch(err){
    next(err)
  }
});

//delete employee
app.delete('/api/employees/:id', async(req, res, next) => {
  try{
    const id = req.body.id
    const SQL = `
    DELETE from employees
    WHERE id = $1
    `
    const response = await client.query(SQL, [id])
    res.sendStatus(204)
  }catch(err){
    next(err)
  }
});

const init = async() => {
await client.connect()
console.log('Connected to the database')

let SQL = `
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCHAR(50)
);
CREATE TABLE employees(
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  department_id INTEGER REFERENCES departments(id) NOT NULL
);`
await client.query(SQL)
console.log('Tables created')
SQL = `
INSERT INTO departments(name) VALUES('Finance');
INSERT INTO departments(name) VALUES('Marketing');
INSERT INTO departments(name) VALUES('Sales');
INSERT INTO employees(name, department_id) VALUES('Sophia', (SELECT id FROM departments WHERE name = 'Finance'));
INSERT INTO employees(name, department_id) VALUES('Ryan', (SELECT id FROM departments WHERE name = 'Marketing'));
INSERT INTO employees(name, department_id) VALUES('Nikki', (SELECT id FROM departments WHERE name = 'Marketing'));
INSERT INTO employees(name, department_id) VALUES('Troy', (SELECT id FROM departments WHERE name = 'Sales'));
INSERT INTO employees(name, department_id) VALUES('Lina', (SELECT id FROM departments WHERE name = 'Finance'));
INSERT INTO employees(name, department_id) VALUES('Ray', (SELECT id FROM departments WHERE name = 'Sales'));
`
await client.query(SQL)
console.log('Data seeded')
app.listen(PORT, ()=>{
  console.log(`Listening on PORT ${PORT}`)
})
}

init()