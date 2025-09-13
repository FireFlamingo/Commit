package org.exstagium.hasheger.utils

import android.content.Context
import android.util.Log
import androidx.core.content.edit
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.security.MessageDigest
import javax.crypto.spec.SecretKeySpec

// User data class
@Serializable
data class User(
    val id: String,
    val username: String,
    val email: String,
    val createdAt: Long = System.currentTimeMillis()
)

// User session state
data class UserSession(
    val user: User,
    val keySpec: SecretKeySpec?,
    val isLoggedIn: Boolean = true
)

object UserStateManager {
    private const val TAG = "UserStateManager"
    private const val PREFS_NAME = "user_prefs"
    private const val USERS_KEY = "registered_users"
    private const val CURRENT_USER_KEY = "current_user"
    private const val LOGIN_STATE_KEY = "is_logged_in"

    private val json = Json { ignoreUnknownKeys = true }

    // ---------------- USER REGISTRATION ----------------
    fun registerUser(
        context: Context,
        username: String,
        email: String,
        password: String
    ): Boolean {
        return try {
            if (username.isBlank() || email.isBlank() || password.isBlank()) {
                Log.e(TAG, "Registration failed: Empty fields")
                return false
            }

            if (userExists(context, email)) {
                Log.e(TAG, "Registration failed: User already exists")
                return false
            }

            val user = User(
                id = generateUserId(email),
                username = username.trim(),
                email = email.trim().lowercase()
            )

            val users = getRegisteredUsers(context).toMutableList()
            users.add(user)
            saveRegisteredUsers(context, users)

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit {
                putBoolean(LOGIN_STATE_KEY, false)
                remove(CURRENT_USER_KEY)
                putString(CURRENT_USER_KEY, json.encodeToString(user))
            }

            // Store password hash for login verification
            savePasswordHash(context, email, password)

            Log.d(TAG, "User registered successfully: ${user.email}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Registration failed", e)
            false
        }
    }

    // ---------------- USER LOGIN ----------------
    fun loginUser(
        context: Context,
        email: String,
        password: String
    ): User? {
        return try {
            if (email.isBlank() || password.isBlank()) {
                Log.e(TAG, "Login failed: Empty credentials")
                return null
            }

            val user = findUserByEmail(context, email)
            if (user == null) {
                Log.e(TAG, "Login failed: User not found")
                return null
            }

            if (!verifyPassword(context, email, password)) {
                Log.e(TAG, "Login failed: Invalid password")
                return null
            }

            // Set user as logged in
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit {
                putString(CURRENT_USER_KEY, json.encodeToString(user))
                putBoolean(LOGIN_STATE_KEY, true)
            }

            Log.d(TAG, "User logged in successfully: ${user.email}")
            user
        } catch (e: Exception) {
            Log.e(TAG, "Login failed", e)
            null
        }
    }

    // ---------------- SESSION MANAGEMENT ----------------
    fun getCurrentUser(context: Context): User? {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val userJson = prefs.getString(CURRENT_USER_KEY, null)
            val isLoggedIn = prefs.getBoolean(LOGIN_STATE_KEY, false)

            Log.d(TAG, "Current user fetched: ${if (userJson != null) "Exists" else "None"}, LoggedIn: $isLoggedIn")

            if (userJson != null && isLoggedIn) {
                json.decodeFromString<User>(userJson)
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get current user", e)
            null
        }
    }

    fun isUserLoggedIn(context: Context): Boolean {
        return getCurrentUser(context) != null
    }

    fun logoutUser(context: Context): Boolean {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit {
                remove(CURRENT_USER_KEY)
                putBoolean(LOGIN_STATE_KEY, false)
            }

            // Also clear vault key
            PasswordVault.clearVault(context)

            Log.d(TAG, "User logged out successfully")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Logout failed", e)
            false
        }
    }

    // ---------------- VAULT INTEGRATION ----------------
    fun setupUserVault(
        context: Context,
        masterPassword: String
    ): VaultResult<SecretKeySpec>? {
        val currentUser = getCurrentUser(context)
        if (currentUser == null) {
            Log.e(TAG, "No user logged in for vault setup")
            return null
        }

        val keySpec = PasswordVault.deriveKeyFromPassword(masterPassword, context)
        if (keySpec != null && PasswordVault.createVaultCheck(
                masterPassword,
                context
            ) is VaultResult.Success
        ) {
            Log.d(TAG, "Vault setup successfully for user: ${currentUser.email}")
            return keySpec
        }

        Log.e(TAG, "Failed to setup vault")
        return null
    }

    fun validateUserVault(
        context: Context,
        masterPassword: String
    ): SecretKeySpec? {
        val currentUser = getCurrentUser(context)
        if (currentUser == null) {
            Log.e(TAG, "No user logged in for vault validation")
            return null
        }

        val isValid = PasswordVault.validateMasterPassword(masterPassword, context) as VaultResult.Success
        return (if (isValid.data) {
            PasswordVault.deriveKeyFromPassword(masterPassword, context)
        } else {
            null
        }) as SecretKeySpec?
    }

    // ---------------- PRIVATE HELPER METHODS ----------------
    private fun getRegisteredUsers(context: Context): List<User> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val usersJson = prefs.getString(USERS_KEY, "[]") ?: "[]"
            json.decodeFromString<List<User>>(usersJson)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get registered users", e)
            emptyList()
        }
    }

    private fun saveRegisteredUsers(context: Context, users: List<User>) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit {
                putString(USERS_KEY, json.encodeToString(users))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save registered users", e)
        }
    }

    private fun userExists(context: Context, email: String): Boolean {
        return findUserByEmail(context, email) != null
    }

    private fun findUserByEmail(context: Context, email: String): User? {
        return getRegisteredUsers(context).find {
            it.email.equals(email.trim(), ignoreCase = true)
        }
    }

    private fun generateUserId(email: String): String {
        return try {
            val digest = MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(email.toByteArray())
            hash.joinToString("") { "%02x".format(it) }.take(16)
        } catch (e: Exception) {
            java.util.UUID.randomUUID().toString().take(16)
        }
    }

    private fun savePasswordHash(context: Context, email: String, password: String) {
        try {
            val digest = MessageDigest.getInstance("SHA-256")
            val salt = email.lowercase() // Simple salt using email
            val hash = digest.digest((password + salt).toByteArray())
            val hashString = hash.joinToString("") { "%02x".format(it) }

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit {
                putString("pwd_${email.lowercase()}", hashString)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save password hash", e)
        }
    }

    private fun verifyPassword(context: Context, email: String, password: String): Boolean {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val storedHash = prefs.getString("pwd_${email.lowercase()}", null)

            if (storedHash == null) return false

            val digest = MessageDigest.getInstance("SHA-256")
            val salt = email.lowercase()
            val hash = digest.digest((password + salt).toByteArray())
            val hashString = hash.joinToString("") { "%02x".format(it) }

            storedHash == hashString
        } catch (e: Exception) {
            Log.e(TAG, "Failed to verify password", e)
            false
        }
    }

    // ---------------- UTILITY METHODS ----------------
    fun getAllUsers(context: Context): List<User> {
        return getRegisteredUsers(context)
    }

    fun deleteUser(context: Context, email: String): Boolean {
        return try {
            val users = getRegisteredUsers(context).toMutableList()
            val removed = users.removeAll { it.email.equals(email, ignoreCase = true) }

            if (removed) {
                saveRegisteredUsers(context, users)

                // Remove password hash
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit {
                    remove("pwd_${email.lowercase()}")
                }

                Log.d(TAG, "User deleted: $email")
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to delete user", e)
            false
        }
    }
}