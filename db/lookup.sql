CREATE TABLE gender_lookup (
    gender_id   SMALLINT     PRIMARY KEY AUTO_INCREMENT,
    gender_name VARCHAR(50)  NOT NULL
);

CREATE TABLE ethnicity_lookup (
    race_id     SMALLINT     PRIMARY KEY AUTO_INCREMENT,
    race_name   VARCHAR(100) NOT NULL
);