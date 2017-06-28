Movie Collection API
=======

Runs on Docker, Node 6.x

```
docker build -t moviecollectionapi .

docker run -d -p "3000:3000" --name moviecollectionapi moviecollectionapi
```

## Example Movies List response
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
                "DVD_Title": "Doctor Strange",
                "Studio": "Marvel",
                "Released": "2016",
                "Status": "Released",
                "Sound": "Atmos",
                "Year": "2016",
                "Genre": "Science Fiction",
                "UPC": "1337007",
                "ID": "1",
                "_id": "5952dd2f7a9c930011afdf58"
            },
            {
                "DVD_Title": "Star Wars Rogue One",
                "Studio": "Lucus Arts",
                "Released": "2016",
                "Status": "Released",
                "Sound": "Atmos",
                "Year": "2016",
                "Genre": "Science Fiction",
                "UPC": "1337006",
                "ID": "2",
                "_id": "5952dd2f7a9c930011afdf59"
            }
        ]
    }
}
```

## Example Movies List response with GraphQL query
### Path
```
  /movies?query={movies{DVD_Title UPC _id}}
```
### Response
```
{
    "data": {
        "movies": [
            {
                "DVD_Title": "Doctor Strange",
                "UPC": "1337007",
                "_id": "5952dd2f7a9c930011afdf58"
            },
            {
                "DVD_Title": "Star Wars Rogue One",
                "UPC": "1337006",
                "_id": "5952dd2f7a9c930011afdf59"
            }
        ]
    }
}
```

## Example POST Movie Response
### Path
```
  /movies
```
### Request payload
```json
{
  "movies": [
    {
      "DVD_Title": "Batman6",
      "Studio": "DC",
      "Released": "2005",
      "Status": "Released",
      "Sound": "Atmos",
      "Year": "2005",
      "Genre": "Science Fiction",
      "UPC": "1337009",
      "ID": "2"
    }
  ]
}
```
### Response
```json
[
    {
        "DVD_Title": "Batman6",
        "Studio": "DC",
        "Released": "2005",
        "Status": "Released",
        "Sound": "Atmos",
        "Year": "2005",
        "Genre": "Science Fiction",
        "UPC": "1337009",
        "ID": "2",
        "_id": "5952f8f3a8c87e00117f972f"
    }
]
```

## Example Movie by ID response
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Response
```json
{
    "data": {
        "movies": [
            {
                "DVD_Title": "Batman Begins",
                "Studio": "DC",
                "Released": "2005",
                "Status": "Released",
                "Sound": "Atmos",
                "Year": "2005",
                "Genre": "Science Fiction",
                "UPC": "1337009",
                "ID": "2",
                "_id": "5952f8f3a8c87e00117f972f"
            }
        ]
    }
}
```

## Example PUT Movie by ID Response
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Request payload
```json
{
  "DVD_Title": "Batman Begins",
  "Studio": "DC",
  "Released": "2005",
  "Status": "Released",
  "Sound": "Atmos",
  "Year": "2005",
  "Genre": "Science Fiction",
  "UPC": "1337009",
  "ID": "2"
}
```
### Response
```json
{
    "n": 1,
    "nModified": 1,
    "ok": 1
}
```

## Example DELETE Movie by ID Response
### Path
```
  /movies/5952f8f3a8c87e00117f972f
```
### Response
```json
{
    "n": 1,
    "ok": 1
}
```
