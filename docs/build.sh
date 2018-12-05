docker run -t -v "$(pwd)":/web craigwillis/sphinx-server make clean
docker run -t -v "$(pwd)":/web craigwillis/sphinx-server make html
