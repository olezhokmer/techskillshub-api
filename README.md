# Start the app

# Create .env file

# Add these parameters to .env file:

PORT=<< any available port on your local machine >>
tokenSecret=<< secret string for json web tokens >>
MONGO_URL=<< url for connecting to mongo db >>

# To upload some data to db please use a db dump, link is provided in PDP

# Here is the command to import this dump:

mongorestore --uri=<< url for connecting to mongo db >> << path_to_dump_directory >>


# Then run these commands:

npm i
node app

