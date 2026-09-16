FROM php:8.2-apache

# Enable PDO MySQL extension required for db.php
RUN docker-php-ext-install pdo pdo_mysql

# Enable mod_rewrite for API routing
RUN a2enmod rewrite

# Copy your backend code into the Apache directory
COPY . /var/www/html/

# Expose standard HTTP port
EXPOSE 80
