FROM python:3.8

WORKDIR /usr/src/app

RUN apt update && apt-get upgrade -y
RUN apt install libgl1 -y
RUN pip3 install --upgrade pip wheel setuptools
#RUN pip3 install --upgrade wheel
#RUN pip3 install --upgrade setuptools

COPY requirements.txt ./
RUN pip3 install -r requirements.txt

COPY . .
CMD [ "python3", "manage.py", "runserver", "0.0.0.0:8091" ]
