# Using Docker
## building file
docker build -t node-scraper .
## running 
docker run -v $(pwd):/app node-scraper https://google.com https://facebook.com --metadata

# using node

# building project node 18
npm i
npm run build
npm run start -- https://microsoft.com https://github.com --metadata