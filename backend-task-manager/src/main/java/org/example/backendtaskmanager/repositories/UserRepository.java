package org.example.backendtaskmanager.repositories;

import org.example.backendtaskmanager.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    /* I used this method for the Login part. I use Optional to take into
     consideration the case where the user is not found */
    Optional<User> findByEmail(String email);

    // I use this method for registration
    boolean existsByEmail(String email);
}
