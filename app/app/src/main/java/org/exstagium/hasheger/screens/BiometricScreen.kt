package org.exstagium.hasheger.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.with
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import org.exstagium.hasheger.ui.theme.HashegerTheme
import org.exstagium.hasheger.utils.BiometricUtils


sealed class AuthState {
    object Initial : AuthState()
    object Loading : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun BiometricAuthScreen(
    biometricUtils: BiometricUtils,
    onAuthenticated: () -> Unit,
    onFailed: () -> Unit = {}
) {
    var message by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var authState by remember { mutableStateOf<AuthState>(AuthState.Initial) }

    LaunchedEffect(Unit) {
        // Auto-trigger biometric on screen load if available
        if (biometricUtils.canAuthenticate()) {
            delay(200) // Small delay for better UX
            authState = AuthState.Loading
            isLoading = true
            biometricUtils.showBiometricPrompt(
                onAuthSuccess = {
                    authState = AuthState.Success
                    isLoading = false
                    onAuthenticated()
                },
                onAuthError = { err ->
                    authState = AuthState.Error(err)
                    isLoading = false
                }
            )
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

                // App Icon/Logo
                Card(
                    modifier = Modifier.size(120.dp),
                    shape = CircleShape,
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            modifier = Modifier.size(60.dp),
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Welcome Text
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Unlock your password vault",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(48.dp))

                // Biometric Icon with Animation
                val infiniteTransition = rememberInfiniteTransition(label = "biometric_pulse")
                val scale by infiniteTransition.animateFloat(
                    initialValue = 1f,
                    targetValue = if (isLoading) 1.1f else 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(1000, easing = EaseInOut),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "scale_animation"
                )

                Card(
                    modifier = Modifier
                        .size(100.dp)
                        .scale(scale),
                    shape = CircleShape,
                    colors = CardDefaults.cardColors(
                        containerColor = when (authState) {
                            is AuthState.Success -> MaterialTheme.colorScheme.primaryContainer
                            is AuthState.Error -> MaterialTheme.colorScheme.errorContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        when (authState) {
                            is AuthState.Loading -> {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(40.dp),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            is AuthState.Success -> {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(50.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }

                            is AuthState.Error -> {
                                Icon(
                                    imageVector = Icons.Default.Error,
                                    contentDescription = null,
                                    modifier = Modifier.size(50.dp),
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }

                            else -> {
                                Icon(
                                    imageVector = Icons.Default.Fingerprint,
                                    contentDescription = null,
                                    modifier = Modifier.size(50.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Status Message
                AnimatedContent(
                    targetState = authState,
                    transitionSpec = {
                        slideInVertically { height -> height } + fadeIn() with
                                slideOutVertically { height -> -height } + fadeOut()
                    },
                    label = "message_animation"
                ) { state ->
                    when (state) {
                        is AuthState.Initial -> {
                            Text(
                                text = "Touch the sensor to unlock",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                                textAlign = TextAlign.Center
                            )
                        }

                        is AuthState.Loading -> {
                            Text(
                                text = "Authenticating...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary,
                                textAlign = TextAlign.Center
                            )
                        }

                        is AuthState.Success -> {
                            Text(
                                text = "Authentication successful!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.primary,
                                textAlign = TextAlign.Center,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        is AuthState.Error -> {
                            Text(
                                text = state.message,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.error,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(48.dp))

                // Action Button
                if (authState !is AuthState.Success) {
                    Button(
                        onClick = {
                            if (biometricUtils.canAuthenticate()) {
                                authState = AuthState.Loading
                                isLoading = true
                                biometricUtils.showBiometricPrompt(
                                    onAuthSuccess = {
                                        authState = AuthState.Success
                                        isLoading = false
                                        onAuthenticated()
                                    },
                                    onAuthError = { err ->
                                        authState = AuthState.Error(err)
                                        isLoading = false
                                        onFailed()
                                    }
                                )
                            } else {
                                authState =
                                    AuthState.Error("Biometric authentication not available")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Fingerprint,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (authState is AuthState.Error) "Try Again" else "Authenticate",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Alternative options
                TextButton(
                    onClick = { /* Navigate to password login */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Use Master Password Instead",
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}