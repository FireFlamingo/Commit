package org.exstagium.hasheger.screens

import android.util.Log
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Password
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.VpnKey
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
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.NavController
import kotlinx.coroutines.delay
import org.exstagium.hasheger.navigation.Screen
import org.exstagium.hasheger.ui.theme.HashegerTheme
import org.exstagium.hasheger.utils.PasswordVault
import org.exstagium.hasheger.utils.VaultResult
import javax.crypto.spec.SecretKeySpec

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavController, userKeySpec: SecretKeySpec? = null,
    entries: List<TotpEntry> = listOf(
        TotpEntry(
            name = "GitHub",
            issuer = "GitHub",
            secret = "JBSWY3DPEHPK3PXP",
            algorithm = "SHA1",
            digits = 6,
            period = 30
        ),
        TotpEntry(
            name = "GitHub",
            issuer = "GitHub",
            secret = "JBSWY3DPEHPK3PXP",
            algorithm = "SHA1",
            digits = 6,
            period = 30
        ),
    ),
    onAddTotp: () -> Unit = {},
    onCopyCode: (String) -> Unit = {},
    onEditEntry: (TotpEntry) -> Unit = {},
    onDeleteEntry: (TotpEntry) -> Unit = {}
) {
    val sampleVaultItems = listOf(
        VaultItem(
            id = "1",
            service = "GitHub",
            username = "dev_user",
            password = "password123",
            notes = "Work repository access",
            isFavorite = true,
            autoLock = true,
            category = "Development",
            strength = PasswordStrength.STRONG
        ),
        VaultItem(
            id = "2",
            service = "Gmail",
            username = "user@gmail.com",
            password = "weak123",
            notes = "Personal email",
            isFavorite = false,
            autoLock = true,
            category = "Personal",
            strength = PasswordStrength.WEAK
        ),
        VaultItem(
            id = "3",
            service = "Netflix",
            username = "moviefan@email.com",
            password = "NetFlix2024!",
            notes = "Streaming service",
            isFavorite = true,
            autoLock = false,
            category = "Entertainment",
            strength = PasswordStrength.MEDIUM
        )
    )
//    var vaultItems = remember { mutableStateListOf<VaultItem>() }
    var vaultItems = remember { mutableStateListOf(*sampleVaultItems.toTypedArray()) }
    val lifecycleOwner = LocalLifecycleOwner.current
    val context = LocalContext.current

    LaunchedEffect(userKeySpec) {
        userKeySpec?.let { keySpec ->
            when (val result = PasswordVault.loadVaultItems(keySpec, context)) {
                is VaultResult.Success -> {
                    vaultItems.clear()
                    vaultItems.addAll(result.data)
                }

                is VaultResult.Error -> {
                    Log.e("VaultScreen", "Failed to load vault items: ${result.message}")
                    // Handle error - maybe show a toast or error state
                    Toast.makeText(
                        context,
                        "Failed to load vault: ${result.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    var currentCodes by remember { mutableStateOf<Map<String, TotpCode>>(emptyMap()) }

    // Update codes every second
    LaunchedEffect(entries) {
        while (true) {
            currentCodes = entries.associate { entry ->
                entry.id to TotpUtil.generateTotpCode(
                    secret = entry.secret,
                    algorithm = entry.algorithm,
                    digits = entry.digits,
                    period = entry.period
                )
            }
            when (val result = PasswordVault.loadVaultItems(userKeySpec, context)) {
                is VaultResult.Success -> {
                    println("Refreshing vault items: ${result.data.size} items loaded")
                    vaultItems.clear()
                    vaultItems.addAll(result.data)
                }

                is VaultResult.Error -> {
                    Log.e("VaultScreen", "Failed to refresh vault items: ${result.message}")
                    // Optionally show error to user
                }
            }
            delay(1000)
        }
    }

    var searchQuery by remember { mutableStateOf("") }
    val keyboardController = LocalSoftwareKeyboardController.current

    val filteredItems = remember(searchQuery, vaultItems) {
        if (searchQuery.isEmpty()) {
            vaultItems
        } else {
            vaultItems.filter { item ->
                item.service.contains(searchQuery, ignoreCase = true) ||
                        item.username.contains(searchQuery, ignoreCase = true) ||
                        item.category.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Hasheger Vault",
                        fontWeight = FontWeight.SemiBold
                    )
                },
                actions = {
                    IconButton(onClick = {
                        navController.navigate(Screen.PasswordGenerator.route)
                    }) {
                        Icon(
                            imageVector = Icons.Default.Password,
                            contentDescription = "Password Generator",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    IconButton(onClick = {
                        navController.navigate(Screen.Settings.route)
                    }) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
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
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.End,
                modifier = Modifier.padding(8.dp)
            ) {
                // Existing Add Password FAB
                FloatingActionButton(
                    onClick = { navController.navigate(Screen.AddEditPassword.route) },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Add Password")
                }

                // New Add TOTP FAB
                FloatingActionButton(
                    onClick = { navController.navigate(Screen.ManualTotpEntry.route) },
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary,
                    modifier = Modifier.size(48.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(imageVector = Icons.Default.VpnKey, contentDescription = "Add TOTP")
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            // Search Bar
            SearchBar(
                query = searchQuery,
                onQueryChange = { searchQuery = it },
                onClearClick = {
                    searchQuery = ""
                    keyboardController?.hide()
                },
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            if (entries.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No authenticators yet",
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Tap + to add your first authenticator",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier,
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(entries) { entry ->
                        currentCodes[entry.id]?.let { code ->
                            TotpListItem(
                                entry = entry,
                                currentCode = code,
                                onCopyCode = onCopyCode,
                                onEdit = onEditEntry,
                                onDelete = onDeleteEntry
                            )
                        }
                    }
                }
            }
            // Vault List
            VaultList(
                items = filteredItems,
                navController = navController,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onClearClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val controller = LocalSoftwareKeyboardController.current
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = {
            Text(
                text = "Search passwords...",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = onClearClick) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = "Clear search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        modifier = modifier.fillMaxWidth(),
        singleLine = true,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(
            onSearch = { controller?.hide() }
        ),
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceContainer,
            focusedContainerColor = MaterialTheme.colorScheme.surfaceContainer
        )
    )
}

@Composable
fun VaultList(items: List<VaultItem>, navController: NavController, modifier: Modifier = Modifier) {
    if (items.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "No passwords found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Try adjusting your search",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                VaultListItem(item) {
                    navController.navigate(Screen.PasswordDetail.createRoute(item.id))
                }
            }
        }
    }
}

@Composable
fun VaultListItem(
    item: VaultItem,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        border = null
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Service Icon
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = item.service.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Content
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.service,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = item.username,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Password Strength Indicator
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val (strengthColor, strengthBgColor) = when (item.strength) {
                        PasswordStrength.WEAK -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.errorContainer
                        PasswordStrength.MEDIUM -> MaterialTheme.colorScheme.tertiary to MaterialTheme.colorScheme.tertiaryContainer
                        PasswordStrength.STRONG -> MaterialTheme.colorScheme.primary to MaterialTheme.colorScheme.primaryContainer
                    }

                    Box(
                        modifier = Modifier
                            .background(
                                color = strengthBgColor,
                                shape = RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = item.strength.name.lowercase()
                                .replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.labelSmall,
                            color = strengthColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Favorite Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (item.isFavorite) Icons.Default.Star else Icons.Default.StarBorder,
                    contentDescription = if (item.isFavorite) "Favorite" else "Not Favorite",
                    tint = if (item.isFavorite) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

// 7. Main TOTP List Screen
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TotpListScreen(
    entries: List<TotpEntry>,
    onAddTotp: () -> Unit,
    onCopyCode: (String) -> Unit,
    onEditEntry: (TotpEntry) -> Unit,
    onDeleteEntry: (TotpEntry) -> Unit
) {

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
    }
}


@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    HashegerTheme {
        val navController = NavController(LocalContext.current)
        DashboardScreen(navController)
    }
}