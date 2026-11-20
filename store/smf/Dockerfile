FROM php:8.2-apache
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip \
 && rm -rf /var/lib/apt/lists/* \
 && docker-php-ext-install mysqli pdo_mysql opcache \
 && a2enmod rewrite
COPY boot.sh /usr/local/bin/webos-boot
RUN chmod +x /usr/local/bin/webos-boot
CMD ["webos-boot"]
