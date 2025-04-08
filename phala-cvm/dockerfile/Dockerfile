FROM yuanyuan/centos

COPY readme.txt /usr/local/readme.txt

ADD jdk-8u45-linux-x64.gz /usr/local/
ADD apache-tomcat-9.0.87.tar.gz /usr/local/

RUN yum -y install vim

ENV MYPATH /usr/local
WORKDIR $MYPATH

ENV JAVA_HOME /usr/local/jdk1.8.0_45
ENV CLASSPATH $JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
ENV CATALINA_HOME /usr/local/apache-tomcat-9.0.87
ENV CATALINA_BASH /usr/local/apache-tomcat-9.0.87
ENV PATH $PATH:$JAVA_HOME/bin:$CATALINA_HOME/lib:$CATALINA_HOME/bin

EXPOSE 8080

CMD /usr/local/apache-tomcat-9.0.87/bin/startup.sh && tail -F /usr/local/apache-tomcat-9.0.87/logs/catalina.out
