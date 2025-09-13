package org.exstagium.hasheger.utils

import android.content.Context
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.core.content.edit
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.exstagium.hasheger.screens.PasswordStrength
import org.exstagium.hasheger.screens.VaultItem
import org.exstagium.hasheger.screens.getPasswordStrength
import java.security.SecureRandom
import java.security.spec.KeySpec
import java.util.Date
import java.util.UUID
import javax.crypto.AEADBadTagException
import javax.crypto.BadPaddingException
import javax.crypto.Cipher
import javax.crypto.IllegalBlockSizeException
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

sealed class VaultResult<out T> {
    data class Success<out T>(val data: T) : VaultResult<T>()
    data class Error(val message: String, val exception: Throwable? = null) : VaultResult<Nothing>()
}

object PasswordVault {
    private const val TAG = "PasswordVault"
    private const val PREFS_NAME = "vault_prefs"
    private const val SALT_KEY = "vault_salt"
    private const val CHECK_KEY = "VAULT_CHECK"
    private const val VAULT_DATA_KEY = "vault_data"
    private const val PBKDF2_ITERATIONS = 100000 // Increased from 65536
    private const val SALT_LENGTH = 32 // Increased from 16
    private const val IV_LENGTH = 12
    private const val TAG_LENGTH = 128

    private val json = Json {
        encodeDefaults = true
        prettyPrint = true
        ignoreUnknownKeys = true
    }

    // ---------------- KEY DERIVATION ----------------
    fun deriveKeyFromPassword(
        password: String,
        context: Context
    ): VaultResult<SecretKeySpec> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val salt: ByteArray = prefs.getString(SALT_KEY, null)?.let {
                try {
                    Base64.decode(it, Base64.NO_WRAP)
                } catch (e: IllegalArgumentException) {
                    Log.e(TAG, "Invalid salt format in preferences", e)
                    return VaultResult.Error("Invalid salt format", e)
                }
            } ?: run {
                val newSalt = generateSalt()
                prefs.edit {
                    putString(SALT_KEY, Base64.encodeToString(newSalt, Base64.NO_WRAP))
                }
                newSalt
            }

            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val spec: KeySpec = PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, 256)
            val tmp = factory.generateSecret(spec)
            val key = SecretKeySpec(tmp.encoded, "AES")

            VaultResult.Success(key)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to derive key from password", e)
            VaultResult.Error("Failed to derive encryption key", e)
        }
    }

    // ---------------- VAULT SETUP ----------------
    fun createVaultCheck(userMasterPassword: String, context: Context): VaultResult<Unit> {
        return try {
            when (val keyResult = deriveKeyFromPassword(userMasterPassword, context)) {
                is VaultResult.Success -> {
                    when (val encryptResult =
                        encrypt("$CHECK_KEY-${System.currentTimeMillis()}", keyResult.data)) {
                        is VaultResult.Success -> {
                            val prefs =
                                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                            prefs.edit { putString(CHECK_KEY, encryptResult.data) }
                            VaultResult.Success(Unit)
                        }

                        is VaultResult.Error -> encryptResult
                    }
                }

                is VaultResult.Error -> keyResult
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create vault check", e)
            VaultResult.Error("Failed to initialize vault", e)
        }
    }

    fun clearVault(context: Context): VaultResult<Unit> {
        return try {
            var prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit { clear() }
            VaultResult.Success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear vault", e)
            VaultResult.Error("Failed to clear vault", e)
        }
    }

    fun isMasterPasswordSet(context: Context): Boolean {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.contains(CHECK_KEY)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking if master password is set", e)
            false
        }
    }

    private var data = listOf<VaultItem>()

    fun validateMasterPassword(
        userMasterPassword: String,
        context: Context
    ): VaultResult<Boolean> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val encryptedData = prefs.getString(CHECK_KEY, null)
                ?: return VaultResult.Error("No master password configured")

            when (val keyResult = deriveKeyFromPassword(userMasterPassword, context)) {
                is VaultResult.Success -> {
                    when (val decryptResult = decrypt(encryptedData, keyResult.data)) {
                        is VaultResult.Success -> {
                            val isValid = decryptResult.data.startsWith(CHECK_KEY)
                            VaultResult.Success(isValid)
                        }

                        is VaultResult.Error -> {
                            // Decryption failed likely means wrong password
                            VaultResult.Success(false)
                        }
                    }
                }

                is VaultResult.Error -> keyResult
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error validating master password", e)
            VaultResult.Error("Failed to validate master password", e)
        }
    }

    // ---------------- UTILITY METHODS ----------------
    fun generateSalt(): ByteArray {
        val salt = ByteArray(SALT_LENGTH)
        SecureRandom().nextBytes(salt)
        return salt
    }

    fun generateSecurePassword(
        length: Int = 16,
        includeUppercase: Boolean = true,
        includeLowercase: Boolean = true,
        includeNumbers: Boolean = true,
        includeSymbols: Boolean = true,
        excludeSimilar: Boolean = false
    ): VaultResult<String> {
        return try {
            if (length < 4) {
                return VaultResult.Error("Password length must be at least 4 characters")
            }

            val uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            val lowercase = "abcdefghijklmnopqrstuvwxyz"
            val numbers = "0123456789"
            val symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            val similar = "il1Lo0O"

            var chars = ""
            if (includeUppercase) chars += uppercase
            if (includeLowercase) chars += lowercase
            if (includeNumbers) chars += numbers
            if (includeSymbols) chars += symbols

            if (excludeSimilar) {
                chars = chars.filterNot { it in similar }
            }

            if (chars.isEmpty()) {
                return VaultResult.Error("At least one character type must be selected")
            }

            val random = SecureRandom()
            val password = (1..length)
                .map { chars[random.nextInt(chars.length)] }
                .joinToString("")

            VaultResult.Success(password)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to generate secure password", e)
            VaultResult.Error("Failed to generate password", e)
        }
    }

    // ---------------- ENCRYPTION / DECRYPTION ----------------
    fun encrypt(data: String, key: SecretKeySpec): VaultResult<String> {
        return try {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val iv = ByteArray(IV_LENGTH).also { SecureRandom().nextBytes(it) }
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(TAG_LENGTH, iv))
            val encrypted = cipher.doFinal(data.toByteArray(Charsets.UTF_8))
            val result = Base64.encodeToString(iv + encrypted, Base64.NO_WRAP)
            VaultResult.Success(result)
        } catch (e: IllegalBlockSizeException) {
            Log.e(TAG, "Invalid block size during encryption", e)
            VaultResult.Error("Encryption failed: Invalid data size", e)
        } catch (e: BadPaddingException) {
            Log.e(TAG, "Bad padding during encryption", e)
            VaultResult.Error("Encryption failed: Bad padding", e)
        } catch (e: Exception) {
            Log.e(TAG, "Encryption failed", e)
            VaultResult.Error("Encryption failed", e)
        }
    }

    fun decrypt(encryptedData: String, key: SecretKeySpec): VaultResult<String> {
        return try {
            val bytes = Base64.decode(encryptedData, Base64.NO_WRAP)
            if (bytes.size < IV_LENGTH) {
                return VaultResult.Error("Invalid encrypted data format")
            }

            val iv = bytes.sliceArray(0 until IV_LENGTH)
            val cipherText = bytes.sliceArray(IV_LENGTH until bytes.size)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(TAG_LENGTH, iv))
            val decrypted = String(cipher.doFinal(cipherText), Charsets.UTF_8)
            VaultResult.Success(decrypted)
        } catch (e: AEADBadTagException) {
            Log.e(TAG, "Authentication tag verification failed", e)
            VaultResult.Error("Decryption failed: Invalid authentication tag", e)
        } catch (e: IllegalArgumentException) {
            Log.e(TAG, "Invalid Base64 data", e)
            VaultResult.Error("Decryption failed: Invalid data format", e)
        } catch (e: IllegalBlockSizeException) {
            Log.e(TAG, "Invalid block size during decryption", e)
            VaultResult.Error("Decryption failed: Invalid data size", e)
        } catch (e: BadPaddingException) {
            Log.e(TAG, "Bad padding during decryption", e)
            VaultResult.Error("Decryption failed: Bad padding", e)
        } catch (e: Exception) {
            Log.e(TAG, "Decryption failed", e)
            VaultResult.Error("Decryption failed", e)
        }
    }

    // ---------------- VAULT OPERATIONS ----------------
    fun saveVaultItems(userKey: SecretKeySpec, vaultItems: List<VaultItem>): VaultResult<String> {
        return try {
            val jsonData = json.encodeToString(vaultItems)
            data = vaultItems
            encrypt(jsonData, userKey)
        } catch (e: SerializationException) {
            Log.e(TAG, "Failed to serialize vault items", e)
            VaultResult.Error("Failed to serialize vault data", e)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save vault items", e)
            VaultResult.Error("Failed to save vault items", e)
        }
    }
    fun saveItem(userKey: SecretKeySpec?, item: VaultItem) {
        val currentList = data.toMutableList()
        val index = currentList.indexOfFirst { it.id == item.id }
        if (index >= 0) currentList[index] = item else currentList.add(item)
        data = currentList
        if(userKey == null) return
        saveVaultItems(userKey, currentList)
    }

    fun loadVaultItems(userKey: SecretKeySpec?, context: Context): VaultResult<List<VaultItem>> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val encryptedData = prefs.getString(VAULT_DATA_KEY, null)
            return VaultResult.Success(data)

            if (userKey == null) return VaultResult.Error("User key is null")

            if (encryptedData.isNullOrEmpty()) {
                when (val saveResult = saveVaultItems(userKey!!, emptyList())) {
                    is VaultResult.Success -> {
                        println("empty vault created")
                        prefs.edit { putString(VAULT_DATA_KEY, saveResult.data) }
                        return VaultResult.Success(emptyList())
                    }

                    is VaultResult.Error -> return saveResult
                }
            }

            when (val decryptResult = decrypt(encryptedData!!, userKey!!)) {
                is VaultResult.Success -> {
                    try {
                        val items: List<VaultItem> = json.decodeFromString(decryptResult.data)
                        println("vault loaded with ${items.size} items")
                        VaultResult.Success(items)
                    } catch (e: SerializationException) {
                        Log.e(TAG, "Failed to deserialize vault items", e)
                        VaultResult.Error("Vault data corrupted", e)
                    }
                }

                is VaultResult.Error -> decryptResult
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load vault items", e)
            VaultResult.Error("Failed to load vault items", e)
        }
    }

    fun deleteVaultItem(userKey: SecretKeySpec, context: Context, id: String): VaultResult<String> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val currentList = loadResult.data.toMutableList()
                val removed = currentList.removeAll { it.id == id }
                if (!removed) {
                    VaultResult.Error("Item with ID $id not found")
                } else {
                    saveVaultItems(userKey, currentList)
                }
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getVaultItem(userKey: SecretKeySpec, context: Context, id: String): VaultResult<VaultItem> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val item = loadResult.data.find { it.id == id }
                if (item != null) {
                    VaultResult.Success(item)
                } else {
                    VaultResult.Error("Item with ID $id not found")
                }
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun searchVaultItems(
        userKey: SecretKeySpec,
        context: Context,
        query: String
    ): VaultResult<List<VaultItem>> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val filteredItems = loadResult.data.filter { item ->
                    item.service.contains(query, ignoreCase = true) ||
                            item.username.contains(query, ignoreCase = true) ||
                            item.category.contains(query, ignoreCase = true) ||
                            item.notes.contains(query, ignoreCase = true)
                }
                VaultResult.Success(filteredItems)
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getItemsByCategory(
        userKey: SecretKeySpec,
        context: Context,
        category: String
    ): VaultResult<List<VaultItem>> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val categoryItems = loadResult.data.filter {
                    it.category.equals(category, ignoreCase = true)
                }
                VaultResult.Success(categoryItems)
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getFavoriteItems(userKey: SecretKeySpec, context: Context): VaultResult<List<VaultItem>> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val favoriteItems = loadResult.data.filter { it.isFavorite }
                VaultResult.Success(favoriteItems)
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getWeakPasswordItems(
        userKey: SecretKeySpec,
        context: Context
    ): VaultResult<List<VaultItem>> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val weakItems = loadResult.data.filter {
                    it.strength == PasswordStrength.WEAK
                }
                VaultResult.Success(weakItems)
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getDuplicatePasswordItems(
        userKey: SecretKeySpec,
        context: Context
    ): VaultResult<List<VaultItem>> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val items = loadResult.data
                val duplicates = items.filter { item ->
                    items.count { it.password == item.password } > 1
                }
                VaultResult.Success(duplicates)
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun exportVault(userKey: SecretKeySpec, context: Context): VaultResult<String> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                try {
                    val exportData = mapOf(
                        "exportDate" to Date().toString(),
                        "itemCount" to loadResult.data.size,
                        "items" to loadResult.data
                    )
                    val jsonString = json.encodeToString(exportData)
                    VaultResult.Success(jsonString)
                } catch (e: SerializationException) {
                    Log.e(TAG, "Failed to export vault", e)
                    VaultResult.Error("Failed to export vault data", e)
                }
            }

            is VaultResult.Error -> loadResult
        }
    }

    fun getVaultStats(userKey: SecretKeySpec, context: Context): VaultResult<VaultStats> {
        return when (val loadResult = loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val items = loadResult.data
                val stats = VaultStats(
                    totalItems = items.size,
                    favoriteItems = items.count { it.isFavorite },
                    weakPasswords = items.count { it.strength == PasswordStrength.WEAK },
                    mediumPasswords = items.count { it.strength == PasswordStrength.MEDIUM },
                    strongPasswords = items.count { it.strength == PasswordStrength.STRONG },
                    categories = items.groupingBy { it.category }.eachCount(),
                    duplicatePasswords = items.groupingBy { it.password }.eachCount()
                        .count { it.value > 1 }
                )
                VaultResult.Success(stats)
            }

            is VaultResult.Error -> loadResult
        }
    }
}

// Data class for vault statistics
data class VaultStats(
    val totalItems: Int,
    val favoriteItems: Int,
    val weakPasswords: Int,
    val mediumPasswords: Int,
    val strongPasswords: Int,
    val categories: Map<String, Int>,
    val duplicatePasswords: Int
)

// Enhanced save function with better error handling
fun saveVaultItem(
    context: Context,
    userKey: SecretKeySpec,
    service: String,
    username: String,
    password: String,
    notes: String,
    isFavorite: Boolean,
    autoLock: Boolean,
    category: String,
    existingItemId: String? = null
): VaultResult<Unit> {
    return try {
        // Validate inputs
        if (service.isBlank()) {
            return VaultResult.Error("Service name cannot be empty")
        }
        if (username.isBlank()) {
            return VaultResult.Error("Username cannot be empty")
        }
        if (password.isBlank()) {
            return VaultResult.Error("Password cannot be empty")
        }

        when (val loadResult = PasswordVault.loadVaultItems(userKey, context)) {
            is VaultResult.Success -> {
                val currentList = loadResult.data.toMutableList()

                // Create or update VaultItem
                val item = VaultItem(
                    id = existingItemId ?: UUID.randomUUID().toString(),
                    service = service.trim(),
                    username = username.trim(),
                    password = password,
                    notes = notes.trim(),
                    isFavorite = isFavorite,
                    autoLock = autoLock,
                    category = category.trim(),
                    strength = getPasswordStrengthType(password)
                )

                // Replace if exists, else add
                val index = currentList.indexOfFirst { it.id == item.id }
                if (index >= 0) currentList[index] = item else currentList.add(item)

                // Save back to vault
                when (val saveResult = PasswordVault.saveVaultItems(userKey, currentList)) {
                    is VaultResult.Success -> {
                        val prefs =
                            context.getSharedPreferences("vault_prefs", Context.MODE_PRIVATE)
                        prefs.edit { putString("vault_data", saveResult.data) }
                        Toast.makeText(context, "Password saved successfully", Toast.LENGTH_SHORT)
                            .show()
                        VaultResult.Success(Unit)
                    }

                    is VaultResult.Error -> saveResult
                }
            }

            is VaultResult.Error -> loadResult
        }
    } catch (e: Exception) {
        Log.e("PasswordVault", "Failed to save vault item", e)
        VaultResult.Error("Failed to save password", e)
    }
}

fun getPasswordStrengthType(password: String): PasswordStrength {
    return try {
        val strength = getPasswordStrength(password)
        when (strength) {
            "Strong" -> PasswordStrength.STRONG
            "Medium" -> PasswordStrength.MEDIUM
            else -> PasswordStrength.WEAK
        }
    } catch (e: Exception) {
        Log.e("PasswordVault", "Error evaluating password strength", e)
        PasswordStrength.WEAK
    }
}