package org.exstagium.hasheger.screens

import android.util.Log
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.exstagium.hasheger.ui.theme.HashegerTheme
import org.exstagium.hasheger.utils.PasswordVault
import org.exstagium.hasheger.utils.VaultResult


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MasterKeyScreen(
    uiState: AuthUiState,
    onSetMasterKey: (String) -> Unit,
    onClearError: () -> Unit,
    onNavigateBack: () -> Unit
) {
    var masterKey by remember { mutableStateOf("") }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(Unit) { onClearError() }
    Surface {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        )
        {
            // Back Button
            IconButton(onClick = onNavigateBack, modifier = Modifier.align(Alignment.Start)) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }

            Spacer(modifier = Modifier.height(32.dp))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Title
                Text(
                    text = "Set Master Key",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Enter a master key that will be used to encrypt and decrypt your passwords.",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Master Key Input (multi-line)
                OutlinedTextField(
                    value = masterKey,
                    onValueChange = { masterKey = it },
                    label = { Text("Master Key") },
                    placeholder = { Text("Enter a strong, memorable key") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Master Key") },
                    singleLine = false,
                    maxLines = 4,
                    keyboardOptions = KeyboardOptions.Default.copy(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            if (masterKey.isNotBlank()) onSetMasterKey(masterKey)
                        }
                    ),
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Register / Set Button
                Button(
                    onClick = { onSetMasterKey(masterKey) },
                    enabled = masterKey.isNotBlank() && !uiState.isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Saving...")
                    } else {
                        Text("Set Master Key")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Error Message
                uiState.error?.let { error ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Info Text
                Text(
                    text = "Your master key should be strong and memorable. It is used to encrypt all your passwords. It is never stored in plain text anywhere. Losing it will mean losing access to all encrypted data.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Preview
@Composable
private fun MasterKeyScreenPreview() {
    HashegerTheme {
        MasterKeyScreen(
            uiState = AuthUiState(),
            onSetMasterKey = {},
            onClearError = {},
            onNavigateBack = {}
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MasterKeyInfoScreen(
    onContinue: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Success Icon
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                modifier = Modifier.size(80.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Title
            Text(
                text = "Master Key Setup Complete!",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Important Notice Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            modifier = Modifier.size(24.dp),
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "IMPORTANT - Keep It Secure!",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "• Your master password is the ONLY way to access your vault\n" +
                                        "• We cannot recover it if you forget it\n" +
                                        "• Forgetting it means losing ALL your stored passwords\n" +
                                        "• Write it down and store it in a safe place\n" +
                                        "• Never share it with anyone",
                                fontSize = 14.sp,
                                lineHeight = 20.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Additional Security Tips
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            modifier = Modifier.size(24.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Security Tips",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "• Use a unique, strong master password\n" +
                                        "• Consider using a passphrase (multiple words)\n" +
                                        "• Enable biometric unlock for convenience\n" +
                                        "• Regularly backup your vault",
                                fontSize = 14.sp,
                                lineHeight = 20.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Continue Button
            Button(
                onClick = onContinue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text(
                    text = "I Understand - Continue",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Disclaimer
            Text(
                text = "By continuing, you acknowledge that you understand the importance of keeping your master password secure.",
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                lineHeight = 16.sp
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MasterKeyNotSetScreen(
    onSetMasterKeyClick: () -> Unit,
    onBack: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Title
            Text(
                text = "Master Key Not Set",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Info
            Text(
                text = "You have not set a master key yet. " +
                        "The master key is required to encrypt and decrypt all your passwords securely. " +
                        "It is never stored in plain text. Please set it now to protect your data.",
                fontSize = 16.sp,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Set Master Key Button
            Button(
                onClick = onSetMasterKeyClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Set Master Key")
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Optional: Back Button
            TextButton(onClick = onBack) {
                Text("Go Back", color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Preview
@Composable
private fun MasterKeyNotSetScreenPreview() {
    HashegerTheme {
        MasterKeyNotSetScreen(
            onSetMasterKeyClick = {},
            onBack = {}
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckMasterKeyScreen(
    uiState: AuthUiState,
    onClearError: () -> Unit,
    onBack: () -> Unit,
    onSuccess: () -> Unit
) {
    var masterKey by remember { mutableStateOf("") }
    var isChecking by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var masterKeyToCheck by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        onClearError()
    }

    fun handlePasswordCheck() {
        focusManager.clearFocus()
        isChecking = true
        errorMessage = null
        scope.launch {
            try {
                when (val result = PasswordVault.validateMasterPassword(masterKey, context)) {
                    is VaultResult.Success -> {
                        if (result.data) {
                            onSuccess()
                        } else {
                            errorMessage = "Master key is incorrect"
                        }
                        isChecking = false
                    }

                    is VaultResult.Error -> {
                        when {
                            result.message.contains("No master password configured") -> {
                                errorMessage = "No vault found, please set up a new master key"
                            }

                            else -> {
                                errorMessage = "Error validating master key: ${result.message}"
                                Log.e("MasterKeyValidation", "Validation error", result.exception)
                            }
                        }
                        isChecking = false
                    }
                }
            } catch (e: Exception) {
                isChecking = false
                Log.e("MasterKeyValidation", "Unexpected error during validation", e)
                errorMessage = "Unexpected error validating master key"
            } finally {
                isChecking = false
                masterKeyToCheck = null
            }

        }
    }

    Surface {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Back Button
            IconButton(onClick = onBack, modifier = Modifier.align(Alignment.Start)) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }

            Spacer(modifier = Modifier.height(32.dp))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Title
                Text(
                    text = "Enter Master Key",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Enter your master key to unlock the vault. Make sure it is the correct one.",
                    fontSize = 16.sp,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Master Key Input
                OutlinedTextField(
                    value = masterKey,
                    onValueChange = { masterKey = it },
                    label = { Text("Master Key") },
                    placeholder = { Text("Enter your key") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Master Key") },
                    singleLine = false,
                    maxLines = 4,
                    keyboardOptions = KeyboardOptions.Default.copy(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                        }
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Validate Button
                Button(
                    onClick = {
                        focusManager.clearFocus()
                        isChecking = true
                        errorMessage = null
                        handlePasswordCheck()
                    },
                    enabled = masterKey.isNotBlank() && !isChecking,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isChecking) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Checking...")
                    } else {
                        Text("Unlock Vault")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Error Message
                val displayedError = errorMessage ?: uiState.error
                displayedError?.let { error ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Info Text
                Text(
                    text = "The master key is used to encrypt and decrypt all your passwords. " +
                            "It is never stored in plain text. Enter it carefully to access your vault.",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Preview
@Composable
private fun CheckMasterKeyScreenPreview() {
    HashegerTheme {
        CheckMasterKeyScreen(
            uiState = AuthUiState(),
            onClearError = {},
            onBack = {},
            onSuccess = {}
        )
    }
}
