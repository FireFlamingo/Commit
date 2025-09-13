package org.exstagium.hasheger.network

import android.content.Context
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class TokenManager(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        "auth_prefs",
        MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) = prefs.edit { putString("jwt_token", token) }
    fun getToken(): String? = prefs.getString("jwt_token", null)
}

class AuthRepository(private val tokenManager: TokenManager) {

    suspend fun register(email: String): Boolean {
        val startResp = ApiClient.api.startRegistration(mapOf("email" to email))
        // Normally here you’d trigger FIDO2, but we just simulate verification
        val verifyResp = ApiClient.api.verifyRegistration(
            mapOf("userId" to startResp.user.id, "credential" to "dummy_credential")
        )
        if (verifyResp.verified && verifyResp.token != null) {
            tokenManager.saveToken(verifyResp.token)
            return true
        }
        return false
    }

    suspend fun login(email: String): Boolean {
        val startResp = ApiClient.api.startAuthentication(mapOf("email" to email))
        val verifyResp = ApiClient.api.verifyAuthentication(
            mapOf("userId" to startResp.user.id, "credential" to "dummy_credential")
        )
        if (verifyResp.verified && verifyResp.token != null) {
            tokenManager.saveToken(verifyResp.token)
            return true
        }
        return false
    }

    fun getToken(): String? = tokenManager.getToken()
}
