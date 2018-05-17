Movie Collection API
=======

Runs on Docker, Node 8.x

Requires authentication to modify content

```
docker build -t moviecollectionapi .

docker run -d -p "3000:3000" --name moviecollectionapi moviecollectionapi
```

# Authentication

Authentication is required for all Modification (Create, Update, Delete) tasks

## Example POST Auth
### Path
```
  /auth
```
### Request payload
```json
{
  "email": "jamesbond@mi6.co.uk",
  "password": "secretagent007"
}
```
### Response
```json
{
    "token": "<jwtToken>"
}
```

# Movies

## Example Get Movies
### Path
```
  /movies
```
### Response
```
{
    "data": {
        "movies": [
            {
                "_id": "59586ecb1d814b0016ce423b",
                "title": "Batman Begins",
                "slug": "batman-begins",
                "year": "2005",
                "format": "Bluray",
                "tmdb_id": "123",
                "tmdb_image_url": "http://someurl",
                "upc": "1337009"
            }
        ]
    }
}
```

## Example Movies List response with GraphQL query
### Path
```
  /movies?query={movies{title upc _id}}
```
### Response
```
{
    "data": {
        "movies": [
            {
                "_id": "59586ecb1d814b0016ce423b",
                "title": "Batman Begins",
                "upc": "1337009"
            }
        ]
    }
}
```

## Example Movie by ID
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Response
```json
{
    "data": {
        "movie": {
            "_id": "59586ecb1d814b0016ce423b",
            "title": "Batman Begins",
            "slug": "batman-begins",
            "year": "2005",
            "format": "Bluray",
            "tmdb_id": "123",
            "tmdb_image_url": "http://www.movies.com/",
            "upc": "1337009"
        }
    }
}
```

## Example POST Movie
### Path
```
  /movies
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "title": "Batman Begins",
  "year": "2005",
  "format": "Bluray",
  "upc": "1337009",
  "tmdb_id": "123",
  "tmdb_image_url": "http://someurl"
}
```
### Response
```json
{
    "data": {
        "addMovie": {
            "_id": "59586ecb1d814b0016ce423b",
            "title": "Batman Begins",
            "slug": "batman-begins",
            "year": "2005",
            "format": "Bluray",
            "tmdb_id": "123",
            "tmdb_image_url": "http://someurl",
            "upc": "1337009"
        }
    }
}
```

## Example PUT Movie by ID
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "title": "Batman Begins",
  "year": "2005",
  "format": "Bluray",
  "upc": "1337009",
  "tmdb_id": "123",
  "tmdb_image_url": "http://www.movies.com/"
}
```
### Response
```json
{
    "data": {
        "updateMovie": {
            "_id": "59586ecb1d814b0016ce423b"
        }
    }
}
```

## Example DELETE Movie by ID
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Response
```json
{
    "data": {
        "deleteMovie": {
            "_id": "5952e72aa5a69f0011be8f66"
        }
    }
}
```

## Example Search Movies
### Path
```
  /search/batman
```
### Response
```
{
    "data": {
        "movies": [
            {
                "_id": "59586ecb1d814b0016ce423b",
                "title": "Batman Begins",
                "slug": "batman-begins",
                "year": "2005",
                "format": "Bluray",
                "tmdb_id": "123",
                "tmdb_image_url": "http://someurl",
                "upc": "1337009"
            }
        ]
    }
}
```

# Movie Formats

## Example GET Formats
### Path
```
  /formats
```
### Response
```json
{
    "data": {
        "formats": [
            {
                "_id": "59592770c0fa0c0017bb2091",
                "title": "Bluray",
                "slug": "bluray"
            }
        ]
    }
}
```

## Example GET Format by ID
### Path
```
  /formats/59592770c0fa0c0017bb2091
```
### Response
```json
{
    "data": {
        "format": {
            "_id": "59592770c0fa0c0017bb2091",
            "title": "Bluray",
            "slug": "bluray"
        }
    }
}
```

### Example POST Format
### Path
```
  /formats
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "title": "Bluray"
}
```
### Response
```json
{
    "data": {
        "addFormat": {
            "_id": "59592770c0fa0c0017bb2091",
            "title": "Bluray",
            "slug": "bluray"
        }
    }
}
```

## Example PUT Format by ID
### Path
```
  /formats/59592770c0fa0c0017bb2091
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "title": "Bluray"
}
```
### Response
```json
{
    "data": {
        "updateFormat": {
            "_id": "59592770c0fa0c0017bb2091"
        }
    }
}
```

## Example DELETE Format by ID
### Path
```
  /formats/59592770c0fa0c0017bb2091
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Response
```json
{
    "data": {
        "deleteFormat": {
            "_id": "59592770c0fa0c0017bb2091"
        }
    }
}
```

# Users

To create the first user on startup, set the following environment variables

```
create_user=true
create_user_email=<email>
create_user_password=<password>
```

## Example POST User
### Path
```
  /users
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "email": "jamesbond@mi6.co.uk",
  "password": "secretagent007"
}
```
### Password Requirements
```
must contain eight characters or more
at least one lowercase and one uppercase alphabetical character
or has at least one lowercase and one numeric character
or has at least one uppercase and one numeric character
```
### Response
```json
{
    "data": {
        "addUser": {
            "_id": "595926b9b2ee950017f1df4c"
        }
    }
}
```

## Example PUT User
### Path
```
  /users/<userId>
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Request payload
```json
{
  "email": "jamesbond@mi6.co.uk",
  "password": "secretagent007"
}
```
### Password Requirements
```
must contain eight characters or more
at least one lowercase and one uppercase alphabetical character
or has at least one lowercase and one numeric character
or has at least one uppercase and one numeric character
```
### Response
```json
{
    "data": {
        "updateUser": {
            "_id": "5954303725a0d4001101b659"
        }
    }
}
```

## Example DELETE User by ID
### Path
```
  /users/<userId>
```
### Request Headers
```
"Authorization: <jwtToken>"
```
### Response
```json
{
    "data": {
        "deleteUser": {
            "_id": "595926b9b2ee950017f1df4c"
        }
    }
}
```

# Developing

## Testing & Linting


* Unit Testing uses [Lab](https://github.com/hapijs/lab) by [Hapi](http://hapijs.com)
* Linting uses [ESLint](http://eslint.org/) built in support from [Lab](https://github.com/hapijs/lab)
