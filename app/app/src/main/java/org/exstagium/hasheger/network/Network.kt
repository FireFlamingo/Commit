package org.exstagium.hasheger.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

// API models
data class UserDto(val id: String, val email: String, val keyDerivationSalt: String)
data class WebAuthnOptionsResponse(val options: Map<String, Any>, val user: UserDto)
data class VerificationResponse(val verified: Boolean, val token: String?, val error: String?, val user: UserDto?)

// Retrofit interface
interface AuthApi {
    @POST("/webauthn/register/start")
    suspend fun startRegistration(@Body body: Map<String, String>): WebAuthnOptionsResponse

    @POST("/webauthn/register/verify")
    suspend fun verifyRegistration(@Body body: Map<String, Any>): VerificationResponse

    @POST("/webauthn/authenticate/start")
    suspend fun startAuthentication(@Body body: Map<String, String>): WebAuthnOptionsResponse

    @POST("/webauthn/authenticate/verify")
    suspend fun verifyAuthentication(@Body body: Map<String, Any>): VerificationResponse
}

// Retrofit instance
object ApiClient {
    val api: AuthApi = Retrofit.Builder()
        .baseUrl("http://10.0.2.2:3000") // Android emulator local host
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(AuthApi::class.java)
}
