const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')

app.use(express.json())

const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeServerAndDatabase = async (request, response) => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error:${e}`)
    process.exit(1)
  }
}
initializeServerAndDatabase()

const validPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const validStatus = requestQuery => {
  return requestQuery.status !== undefined
}

const validCategory = requestQuery => {
  return requestQuery.category !== undefined
}

const validDuedate = requestQuery => {
  return requestQuery.dueDate !== undefined
}

const validTodo = requestQuery => {
  return requestQuery.todo !== undefined
}

const priorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const categoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const categoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const isValidStatus = status => {
  if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    return true
  } else {
    return false
  }
}

const isValidPriority = priority => {
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    return true
  } else {
    return false
  }
}

const isValidCategory = category => {
  if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
    return true
  } else {
    return false
  }
}

const isValidDuedate = date => {
  return isValid(new Date(date))
}

const formattedTodo = data => {
  return {
    id: data.id,
    todo: data.todo,
    category: data.category,
    priority: data.priority,
    status: data.status,
    dueDate: data.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  const {todo = '', status, priority, category, dueDate} = request.query
  let data = null
  let getQuery = ''
  switch (true) {
    case validStatus(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND status = '${status}'`
      if (isValidStatus(status)) {
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case validPriority(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND priority= '${priority}'`
      if (isValidPriority(priority)) {
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case priorityAndStatusProperties(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND priority= '${priority}' AND status = '${status}'`
      if (isValidStatus(status) && isValidPriority(priority)) {
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else if (isValidStatus(status)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case categoryAndStatusProperties(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND category= '${category}' AND status = '${status}'`
      if (isValidCategory(category) && isValidStatus(status)) {
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else if (isValidStatus(status)) {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case validCategory(request.query):
      if (isValidCategory(category)) {
        getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND category= '${category}'`
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case categoryAndPriorityProperties(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%' AND category= '${category}' AND priority = '${priority}'`
      if (isValidCategory(category) && isValidPriority(priority)) {
        data = await db.all(getQuery)
        response.send(data.map(each => formattedTodo(each)))
      } else if (isValidPriority(priority)) {
        response.status(400)
        response.send('Invalid Todo Category')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    default:
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${todo}%'`
      data = await db.all(getQuery)
      response.send(data.map(each => formattedTodo(each)))
      break
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `SELECT * FROM todo WHERE id=${todoId}`
  const data = await db.get(getQuery)
  response.send(formattedTodo(data))
})

app.get('/agenda/', async (request, response) => {
  const {dueDate} = request.query
  const fromattedDate = format(new Date(dueDate), 'yy-MM-dd')
  if (dueDate === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidDuedate(dueDate)) {
      const getQuery = `SELECT * FROM todo WHERE due_date='${fromattedDate}'`
      const data = await db.all(getQuery)
      response.send(data.map(each => formattedTodo(each)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  switch (false) {
    case isValidStatus(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isValidCategory(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isValidPriority(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidDuedate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formmatedDate = format(new Date(dueDate), 'yy-MM-dd')
      const getQuery = `INSERT INTO 
      todo(id,todo,status,priority,category,due_date) 
      VALUES
      (${id},'${todo}','${status}','${priority}','${category}','${formmatedDate}')`
      const data = await db.run(getQuery)
      response.send('Todo Successfully Added')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, status, priority, category, dueDate} = request.body
  let getQuery = ''
  let data = null
  switch (true) {
    case validStatus(request.body):
      getQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId}`
      if (isValidStatus(status)) {
        data = await db.run(getQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case validCategory(request.body):
      getQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId} `
      if (isValidCategory(category)) {
        data = await db.run(getQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case validPriority(request.body):
      getQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId}`
      if (isValidPriority(priority)) {
        data = await db.run(getQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case validDuedate(request.body):
      getQuery = `UPDATE todo SET due_date='${dueDate}'  WHERE id=${todoId}`
      if (isValidDuedate(dueDate)) {
        data = await db.run(getQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      getQuery = `UPDATE todo SET todo='${todo}'`
      data = await db.run(getQuery)
      response.send('Todo Updated')
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `DELETE FROM todo WHERE id=${todoId}`
  const data = await db.run(getQuery)
  response.send('Todo Deleted')
})

module.exports = app
