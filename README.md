Movie Collection API
=======

Movie Collection API

Runs on Docker, Node 6.x

```
docker build -t moviecollectionapi .

docker run -d -p "3000:3000" --name moviecollectionapi moviecollectionapi
```

##Example Collection Request
```
http://localhost:8080/movies
```

##Example GraphQL Collection Request
```
http://localhost:8080/movies?query={movies{DVD_Title Studio Released Status Sound Year Genre UPC ID}}
```

##Example Movies List response
```
{
  data: {
    movies: [
      {
        DVD_Title: "Doctor Strange",
        Studio: "Marvel",
        Released: "2016",
        Year: "2016",
        UPC: "1337007",
        ID: "1"
      },
      {
        DVD_Title: "Star Wars Rogue One",
        Studio: "Lucus Arts",
        Released: "2016",
        Year: "2016",
        UPC: "1337006",
        ID: "2"
      }
    ]
  }
}
```
