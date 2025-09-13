package org.exstagium.hasheger.utils

import android.content.Context
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.exstagium.hasheger.screens.PasswordDetailScreen
import java.io.IOException
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.Mac
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

@Serializable
data class RegisterRequest(
    val email: String,
    val encryptedVaultKey: String,
    val salt: String
)

@Serializable
data class LoginStartRequest(
    val email: String
)

@Serializable
data class LoginVerifyRequest(
    val loginToken: String,
    val proof: String
)

@Serializable
data class ChangePasswordRequest(
    val userId: String,
    val newEncryptedVaultKey: String
)

@Serializable
data class RegisterResponse(
    val token: String,
    val userId: String
)

@Serializable
data class LoginStartResponse(
    val encryptedVaultKey: String,
    val salt: String,
    val loginToken: String,
    val userId: String
)

@Serializable
data class LoginVerifyResponse(
    val token: String,
    val userId: String,
    val email: String
)

@Serializable
data class ApiError(
    val error: String
)

object AuthUtil {
    private const val PREFS_NAME = "auth_prefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_EMAIL = "user_email"
    private const val PBKDF2_ITERATIONS = 100000
    private const val VAULT_KEY_SIZE = 256 // bits

    private val json = Json { ignoreUnknownKeys = true }
    private val client = OkHttpClient()
    private val mediaType = "application/json; charset=utf-8".toMediaType()

    private var baseUrl = "https://temp-backend2-xi.vercel.app" // Default for Android emulator

    fun setBaseUrl(url: String) {
        baseUrl = url
    }

    // Generate random salt for PBKDF2
    private fun generateSalt(): ByteArray {
        val salt = ByteArray(32)
        SecureRandom().nextBytes(salt)
        return salt
    }

    // Derive master key from password using PBKDF2
    private fun deriveMasterKey(password: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, 256)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        return factory.generateSecret(spec).encoded
    }

    // Generate random vault key
    private fun generateVaultKey(): ByteArray {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(VAULT_KEY_SIZE)
        return keyGen.generateKey().encoded
    }

    // Encrypt vault key with master key using AES-GCM
    private fun encryptVaultKey(vaultKey: ByteArray, masterKey: ByteArray): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = javax.crypto.spec.SecretKeySpec(masterKey, "AES")
        cipher.init(Cipher.ENCRYPT_MODE, keySpec)

        val iv = cipher.iv
        val encryptedData = cipher.doFinal(vaultKey)

        // Combine IV + encrypted data
        val combined = iv + encryptedData
        return Base64.encodeToString(combined, Base64.NO_WRAP)
    }

    // Decrypt vault key with master key
    private fun decryptVaultKey(encryptedVaultKey: String, masterKey: ByteArray): ByteArray {
        val combined = Base64.decode(encryptedVaultKey, Base64.NO_WRAP)
        val iv = combined.sliceArray(0..11) // GCM IV is 12 bytes
        val encryptedData = combined.sliceArray(12 until combined.size)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keySpec = javax.crypto.spec.SecretKeySpec(masterKey, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

        return cipher.doFinal(encryptedData)
    }

    // Generate HMAC proof for login verification
    private fun generateProof(masterKey: ByteArray, encryptedVaultKey: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(masterKey, "HmacSHA256")
        mac.init(keySpec)
        return mac.doFinal(encryptedVaultKey.toByteArray()).joinToString("") {
            "%02x".format(it)
        }
    }

    // Save auth data to SharedPreferences
    private fun saveAuthData(context: Context, token: String, userId: String, email: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_ID, userId)
            putString(KEY_EMAIL, email)
            apply()
        }
    }

    // Get saved token
    fun getToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_TOKEN, null)
    }

    // Get saved user ID
    fun getUserId(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_USER_ID, null)
    }

    // Get saved email
    fun getEmail(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_EMAIL, null)
    }

    // Check if user is logged in
    fun isLoggedIn(context: Context): Boolean {
        return getToken(context) != null
    }

    // Clear auth data (logout)
    fun logout(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    // Register new user
    suspend fun register(
        email: String,
        password: String,
        context: Context
    ): Result<RegisterResponse> {
        return withContext(Dispatchers.IO) {
            try {
                // Generate salt and derive master key
                val salt = generateSalt()
                val masterKey = deriveMasterKey(password, salt)

                // Generate vault key and encrypt it
                val vaultKey = generateVaultKey()
                val encryptedVaultKey = encryptVaultKey(vaultKey, masterKey)

                val request = RegisterRequest(
                    email = email,
                    encryptedVaultKey = encryptedVaultKey,
                    salt = Base64.encodeToString(salt, Base64.NO_WRAP)
                )

                val requestBody = json.encodeToString(request).toRequestBody(mediaType)
                val httpRequest = Request.Builder()
                    .url("$baseUrl/api/auth/register")
                    .post(requestBody)
                    .build()

                val response = client.newCall(httpRequest).execute()
                val responseBody = response.body?.string() ?: ""

                if (response.isSuccessful) {
                    val registerResponse = json.decodeFromString<RegisterResponse>(responseBody)
                    saveAuthData(context, registerResponse.token, registerResponse.userId, email)
                    PasswordVault.saveSalt(context, salt)
                    PasswordVault.createVaultCheck(password, context)
                    Result.success(registerResponse)
                } else {
                    val error = try {
                        json.decodeFromString<ApiError>(responseBody)
                    } catch (e: Exception) {
                        ApiError("Registration failed")
                    }
                    Result.failure(Exception(error.error))
                }
            } catch (e: IOException) {
                Result.failure(Exception("Network error: ${e.message}"))
            } catch (e: Exception) {
                Result.failure(Exception("Registration failed: ${e.message}"))
            }
        }
    }

    // Start login process
    suspend fun loginStart(email: String): Result<LoginStartResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val request = LoginStartRequest(email = email)
                val requestBody = json.encodeToString(request).toRequestBody(mediaType)
                val httpRequest = Request.Builder()
                    .url("$baseUrl/api/auth/login/start")
                    .post(requestBody)
                    .build()

                val response = client.newCall(httpRequest).execute()
                val responseBody = response.body?.string() ?: ""

                if (response.isSuccessful) {
                    val loginStartResponse = json.decodeFromString<LoginStartResponse>(responseBody)
                    Result.success(loginStartResponse)
                } else {
                    val error = try {
                        json.decodeFromString<ApiError>(responseBody)
                    } catch (e: Exception) {
                        ApiError("Login failed")
                    }
                    Result.failure(Exception(error.error))
                }
            } catch (e: IOException) {
                Result.failure(Exception("Network error: ${e.message}"))
            } catch (e: Exception) {
                Result.failure(Exception("Login failed: ${e.message}"))
            }
        }
    }

    // Complete login process
    suspend fun loginVerify(
        loginToken: String,
        encryptedVaultKey: String,
        salt: String,
        password: String,
        context: Context
    ): Result<LoginVerifyResponse> {
        return withContext(Dispatchers.IO) {
            try {
                // Derive master key from password and salt
                val saltBytes = Base64.decode(salt, Base64.NO_WRAP)
                val masterKey = deriveMasterKey(password, saltBytes)

                // Verify password by attempting to decrypt vault key
                try {
                    decryptVaultKey(encryptedVaultKey, masterKey)
                } catch (e: Exception) {
                    return@withContext Result.failure(Exception("Invalid password"))
                }

                // Generate proof for server verification
                val proof = generateProof(masterKey, encryptedVaultKey)

                val request = LoginVerifyRequest(
                    loginToken = loginToken,
                    proof = proof
                )

                val requestBody = json.encodeToString(request).toRequestBody(mediaType)
                val httpRequest = Request.Builder()
                    .url("$baseUrl/api/auth/login/verify")
                    .post(requestBody)
                    .build()

                val response = client.newCall(httpRequest).execute()
                val responseBody = response.body?.string() ?: ""

                if (response.isSuccessful) {
                    val loginResponse = json.decodeFromString<LoginVerifyResponse>(responseBody)
                    saveAuthData(
                        context,
                        loginResponse.token,
                        loginResponse.userId,
                        loginResponse.email
                    )
                    PasswordVault.saveSalt(context, saltBytes)
                    PasswordVault.createVaultCheck(password, context)
                    Result.success(loginResponse)
                } else {
                    val error = try {
                        json.decodeFromString<ApiError>(responseBody)
                    } catch (e: Exception) {
                        ApiError("Login verification failed")
                    }
                    Result.failure(Exception(error.error))
                }
            } catch (e: IOException) {
                Result.failure(Exception("Network error: ${e.message}"))
            } catch (e: Exception) {
                Result.failure(Exception("Login verification failed: ${e.message}"))
            }
        }
    }

    // Complete login (combines loginStart and loginVerify)
    suspend fun login(
        email: String,
        password: String,
        context: Context
    ): Result<LoginVerifyResponse> {
        return try {
            // Step 1: Start login
            val startResult = loginStart(email)
            if (startResult.isFailure) {
                return Result.failure(startResult.exceptionOrNull()!!)
            }

            val startResponse = startResult.getOrThrow()

            // Step 2: Verify login
            loginVerify(
                loginToken = startResponse.loginToken,
                encryptedVaultKey = startResponse.encryptedVaultKey,
                salt = startResponse.salt,
                password = password,
                context = context
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Change master password
    suspend fun changePassword(
        userId: String,
        oldPassword: String,
        newPassword: String,
        encryptedVaultKey: String,
        salt: String,
        context: Context
    ): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            try {
                // Derive old master key and decrypt vault key
                val saltBytes = Base64.decode(salt, Base64.NO_WRAP)
                val oldMasterKey = deriveMasterKey(oldPassword, saltBytes)
                val vaultKey = decryptVaultKey(encryptedVaultKey, oldMasterKey)

                // Generate new salt and derive new master key
                val newSalt = generateSalt()
                val newMasterKey = deriveMasterKey(newPassword, newSalt)

                // Encrypt vault key with new master key
                val newEncryptedVaultKey = encryptVaultKey(vaultKey, newMasterKey)

                val request = ChangePasswordRequest(
                    userId = userId,
                    newEncryptedVaultKey = newEncryptedVaultKey
                )

                val token = getToken(context)
                    ?: return@withContext Result.failure(Exception("Not logged in"))

                val requestBody = json.encodeToString(request).toRequestBody(mediaType)
                val httpRequest = Request.Builder()
                    .url("$baseUrl/api/auth/change-password")
                    .addHeader("Authorization", "Bearer $token")
                    .post(requestBody)
                    .build()

                val response = client.newCall(httpRequest).execute()

                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    val responseBody = response.body?.string() ?: ""
                    val error = try {
                        json.decodeFromString<ApiError>(responseBody)
                    } catch (e: Exception) {
                        ApiError("Password change failed")
                    }
                    Result.failure(Exception(error.error))
                }
            } catch (e: IOException) {
                Result.failure(Exception("Network error: ${e.message}"))
            } catch (e: Exception) {
                Result.failure(Exception("Password change failed: ${e.message}"))
            }
        }
    }

    // Get vault key for encrypting/decrypting user data
    fun getVaultKey(password: String, encryptedVaultKey: String, salt: String): ByteArray? {
        return try {
            val saltBytes = Base64.decode(salt, Base64.NO_WRAP)
            val masterKey = deriveMasterKey(password, saltBytes)
            decryptVaultKey(encryptedVaultKey, masterKey)
        } catch (e: Exception) {
            null
        }
    }
}