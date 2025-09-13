package org.exstagium.hasheger.screens

import android.content.Context
import android.widget.Toast
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.edit
import androidx.navigation.NavController
import kotlinx.serialization.Serializable
import org.exstagium.hasheger.utils.PasswordVault
import org.exstagium.hasheger.utils.saveVaultItem
import java.util.UUID
import javax.crypto.spec.SecretKeySpec

@Serializable
data class VaultItem(
    val id: String = "",
    val service: String,
    val username: String,
    val password: String,
    val notes: String = "",
    val isFavorite: Boolean = false,
    val autoLock: Boolean = true,
    val category: String = "General",
    val strength: PasswordStrength = PasswordStrength.WEAK
)

@Serializable
enum class PasswordStrength {
    WEAK, MEDIUM, STRONG
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditPasswordScreen(navController: NavController, existingItem: VaultItem? = null) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    var service by remember { mutableStateOf(existingItem?.service ?: "") }
    var username by remember { mutableStateOf(existingItem?.username ?: "") }
    var password by remember { mutableStateOf(existingItem?.password ?: "") }
    var notes by remember { mutableStateOf(existingItem?.notes ?: "") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var favorite by remember { mutableStateOf(existingItem?.isFavorite ?: false) }
    var autoLock by remember { mutableStateOf(existingItem?.autoLock ?: true) }
    var category by remember { mutableStateOf(existingItem?.category ?: "General") }

    val passwordStrength = remember(password) { getPasswordStrength(password) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (existingItem != null) "Edit Password" else "Add Password",
                        fontWeight = FontWeight.SemiBold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    if (service.isBlank() || username.isBlank() || password.isBlank()) {
                        Toast.makeText(
                            context,
                            "Please fill all required fields",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        val newItem = VaultItem(
                            id = existingItem?.id ?: UUID.randomUUID().toString(),
                            service = service,
                            username = username,
                            password = password,
                            notes = notes,
                            isFavorite = favorite,
                            autoLock = autoLock,
                            category = category,
                            strength = when (passwordStrength) {
                                "Weak" -> PasswordStrength.WEAK
                                "Medium" -> PasswordStrength.MEDIUM
                                else -> PasswordStrength.STRONG
                            }
                        )
                        PasswordVault.saveItem(null, newItem)
                        Toast.makeText(context, "Password saved successfully", Toast.LENGTH_SHORT)
                            .show()
                        navController.popBackStack()
                    }
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Done, contentDescription = "Save")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Service Field
            OutlinedTextField(
                value = service,
                onValueChange = { service = it },
                label = { Text("Service / Website *") },
                placeholder = { Text("e.g., Gmail, GitHub, Netflix") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Username Field
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username / Email *") },
                placeholder = { Text("Enter username or email") },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    if (username.isNotEmpty()) {
                        IconButton(onClick = {
                            clipboardManager.setText(AnnotatedString(username))
                            Toast.makeText(context, "Username copied", Toast.LENGTH_SHORT).show()
                        }) {
                            Icon(
                                Icons.Default.ContentCopy,
                                contentDescription = "Copy Username",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Password Field
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password *") },
                placeholder = { Text("Enter a strong password") },
                visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    Row {
                        IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                            Icon(
                                imageVector = if (isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "Toggle Password Visibility",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (password.isNotEmpty()) {
                            IconButton(onClick = {
                                clipboardManager.setText(AnnotatedString(password))
                                Toast.makeText(context, "Password copied", Toast.LENGTH_SHORT)
                                    .show()
                            }) {
                                Icon(
                                    Icons.Default.ContentCopy,
                                    contentDescription = "Copy Password",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(onClick = { password = generateRandomPassword(12) }) {
                            Icon(
                                Icons.Default.Shuffle,
                                contentDescription = "Generate Random Password",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Password Strength Indicator
            if (password.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = when (passwordStrength) {
                            "Weak" -> MaterialTheme.colorScheme.errorContainer
                            "Medium" -> MaterialTheme.colorScheme.tertiaryContainer
                            else -> MaterialTheme.colorScheme.primaryContainer
                        }
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val strengthColor = when (passwordStrength) {
                            "Weak" -> MaterialTheme.colorScheme.error
                            "Medium" -> MaterialTheme.colorScheme.tertiary
                            else -> MaterialTheme.colorScheme.primary
                        }

                        Icon(
                            imageVector = when (passwordStrength) {
                                "Weak" -> Icons.Default.Warning
                                "Medium" -> Icons.Default.Info
                                else -> Icons.Default.CheckCircle
                            },
                            contentDescription = null,
                            tint = strengthColor,
                            modifier = Modifier.size(20.dp)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Text(
                            text = "Password Strength: $passwordStrength",
                            color = strengthColor,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Category Field
            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Category") },
                placeholder = { Text("e.g., Work, Personal, Social") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Notes Field
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                placeholder = { Text("Add any additional notes (optional)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                maxLines = 5,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(12.dp)
            )

            // Settings Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Settings",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = if (favorite) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Mark as Favorite",
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.weight(1f)
                        )
                        Switch(
                            checked = favorite,
                            onCheckedChange = { favorite = it }
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = if (autoLock) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Enable Auto-lock",
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Text(
                                text = "Lock this entry after timeout",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = autoLock,
                            onCheckedChange = { autoLock = it }
                        )
                    }
                }
            }

            // Bottom spacing for FAB
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

// Enhanced password strength calculation
fun getPasswordStrength(password: String): String {
    if (password.isEmpty()) return "Weak"

    var score = 0

    // Length check
    when {
        password.length >= 12 -> score += 2
        password.length >= 8 -> score += 1
    }

    // Character variety
    if (password.any { it.isLowerCase() }) score += 1
    if (password.any { it.isUpperCase() }) score += 1
    if (password.any { it.isDigit() }) score += 1
    if (password.any { "!@#\$%^&*()-_=+[]{}|;:,.<>?".contains(it) }) score += 1

    return when {
        score >= 5 -> "Strong"
        score >= 3 -> "Medium"
        else -> "Weak"
    }
}

// Enhanced random password generator
fun generateRandomPassword(length: Int): String {
    val lowercase = "abcdefghijklmnopqrstuvwxyz"
    val uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    val digits = "0123456789"
    val symbols = "!@#\$%^&*()-_=+"
    val allChars = lowercase + uppercase + digits + symbols

    return (1..length).map { allChars.random() }.joinToString("")
}

@Preview(showBackground = true)
@Composable
private fun AddEditPasswordScreenPreview() {
    AddEditPasswordScreen(navController = androidx.navigation.compose.rememberNavController())
}