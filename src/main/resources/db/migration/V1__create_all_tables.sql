-- DUWASA FAMS - V1 DATABASE MIGRATION

-- 1. USERS

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    fname VARCHAR(100),
    lname VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    role VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    registration_number VARCHAR(100) UNIQUE,
    college_name VARCHAR(150),
    course VARCHAR(150),
    year_of_study INT,

    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- 3. DEPARTMENTS

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(150) UNIQUE,
    description TEXT,
    total_slots INT,
    occupied_slots INT,
    status VARCHAR(20)
);
-- 4. DEPARTMENT_COORDINATORS
CREATE TABLE department_coordinators (
    department_coordinator_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    department_id INT UNIQUE,

    CONSTRAINT fk_coordinator_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_coordinator_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
);

-- 5. FIELD_APPLICATIONS

CREATE TABLE field_applications (
    application_id SERIAL PRIMARY KEY,
    student_id INT,
    department_id INT,
    application_date TIMESTAMP,
    start_date DATE,
    end_date DATE,
    status VARCHAR(40),
    comments TEXT,

    CONSTRAINT fk_application_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_application_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
);

-- 6. APPLICATION_DOCUMENTS

CREATE TABLE application_documents (
    document_id SERIAL PRIMARY KEY,
    application_id INT,
    document_type VARCHAR(100),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    upload_date TIMESTAMP,
    verification_status VARCHAR(30),

    CONSTRAINT fk_document_application
        FOREIGN KEY (application_id)
        REFERENCES field_applications(application_id)
);

-- 7. APPLICATION_HISTORY

CREATE TABLE application_history (
    history_id SERIAL PRIMARY KEY,
    application_id INT,
    performed_by INT,
    action VARCHAR(100),
    comments TEXT,
    action_date TIMESTAMP,

    CONSTRAINT fk_history_application
        FOREIGN KEY (application_id)
        REFERENCES field_applications(application_id),

    CONSTRAINT fk_history_user
        FOREIGN KEY (performed_by)
        REFERENCES users(user_id)
);

-- 8. NOTIFICATIONS

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT,
    application_id INT,
    message TEXT,
    notification_type VARCHAR(50),
    sent_date TIMESTAMP,
    status VARCHAR(30),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_notification_application
        FOREIGN KEY (application_id)
        REFERENCES field_applications(application_id)
);

-- 9. PLACEMENT_LETTERS

CREATE TABLE placement_letters (
    letter_id SERIAL PRIMARY KEY,
    application_id INT UNIQUE,
    letter_number VARCHAR(100) UNIQUE,
    issue_date DATE,
    file_name VARCHAR(255),
    file_path VARCHAR(500),

    CONSTRAINT fk_letter_application
        FOREIGN KEY (application_id)
        REFERENCES field_applications(application_id)
);