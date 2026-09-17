FROM php:8.2-apache

# Enable PDO MySQL extension required for db.php
RUN docker-php-ext-install pdo pdo_mysql

# Enable mod_rewrite for API routing and mod_headers for CORS on error pages
RUN a2enmod rewrite headers

# Allow .htaccess overrides in Apache config
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Configure Apache to listen on Render's dynamic $PORT
RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# Copy your backend code into the Apache directory
COPY . /var/www/html/
