package org.exstagium.hasheger.screens

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.ImportExport
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import org.exstagium.hasheger.navigation.Screen
import org.exstagium.hasheger.utils.AuthUtil
import org.exstagium.hasheger.utils.PasswordVault

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController) {
    val context = LocalContext.current

    var biometricEnabled by remember { mutableStateOf(true) }
    var darkModeEnabled by remember { mutableStateOf(false) }
    var autoLockEnabled by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {

            // Account Section
            Text("Account", style = MaterialTheme.typography.titleMedium)
            SettingsCard {
                SettingsItem(
                    icon = Icons.Default.Person,
                    title = "Change Master Password",
                    onClick = {
                        Toast.makeText(context, "Change Master Password (demo)", Toast.LENGTH_SHORT)
                            .show()
                    }
                )
                SettingsItem(
                    icon = Icons.Default.ExitToApp,
                    title = "Sign Out",
                    onClick = {
                        PasswordVault.clearVault(context)
                        AuthUtil.logout(context)
                        Toast.makeText(context, "Logged out", Toast.LENGTH_SHORT).show()
                        navController.navigate("login") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    }
                )
            }

            // Security Section
            Text("Security", style = MaterialTheme.typography.titleMedium)
            SettingsCard {
                SettingsItem(
                    icon = Icons.Default.Fingerprint,
                    title = "Biometric Authentication",
                    onClick = {
                        navController.navigate(Screen.BiometricScreen.route)
                    }
                )
                SettingsToggle(
                    icon = Icons.Default.Lock,
                    title = "Auto-lock Vault",
                    checked = autoLockEnabled,
                    onCheckedChange = { autoLockEnabled = it }
                )
                SettingsItem(
                    icon = Icons.Default.Security,
                    title = "Emergency Access",
                    onClick = {
                        Toast.makeText(context, "Emergency Access (demo)", Toast.LENGTH_SHORT)
                            .show()
                    }
                )
            }

            // Preferences Section
            Text("Preferences", style = MaterialTheme.typography.titleMedium)
            SettingsCard {
                SettingsToggle(
                    icon = Icons.Default.DarkMode,
                    title = "Dark Mode",
                    checked = darkModeEnabled,
                    onCheckedChange = { darkModeEnabled = it }
                )
                SettingsItem(
                    icon = Icons.Default.ImportExport,
                    title = "Export / Import Vault",
                    onClick = {
                        Toast.makeText(context, "Export / Import (demo)", Toast.LENGTH_SHORT).show()
                    }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // App Info
            Text("App Info", style = MaterialTheme.typography.titleMedium)
            SettingsCard {
                SettingsItem(
                    icon = Icons.Default.Info,
                    title = "Version 1.0.0",
                    onClick = {}
                )
                SettingsItem(
                    icon = Icons.Default.Help,
                    title = "Help & Support",
                    onClick = {
                        Toast.makeText(context, "Help clicked (demo)", Toast.LENGTH_SHORT).show()
                    }
                )
            }
        }
    }
}

@Composable
fun SettingsCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            content = content
        )
    }
}

@Composable
fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = title)
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
fun SettingsToggle(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = title)
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
