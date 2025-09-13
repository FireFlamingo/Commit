package org.exstagium.hasheger.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.delay
import org.exstagium.hasheger.ui.theme.HashegerTheme
import java.nio.ByteBuffer
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.pow

// 1. Data Models
data class TotpEntry(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val issuer: String,
    val secret: String,
    val algorithm: String = "SHA1",
    val digits: Int = 6,
    val period: Int = 30,
    val createdAt: Long = System.currentTimeMillis()
)

data class TotpCode(
    val code: String,
    val remainingTime: Int
)

// 2. TOTP Utility Class
object TotpUtil {
    private const val BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    fun generateTotpCode(secret: String, algorithm: String = "SHA1", digits: Int = 6, period: Int = 30): TotpCode {
        val currentTime = System.currentTimeMillis() / 1000
        val timeSlot = currentTime / period
        val remainingTime = period - (currentTime % period).toInt()

        val secretBytes = base32Decode(secret)
        val timeBytes = ByteBuffer.allocate(8).putLong(timeSlot).array()

        val mac = Mac.getInstance("Hmac$algorithm")
        mac.init(SecretKeySpec(secretBytes, "Hmac$algorithm"))
        val hash = mac.doFinal(timeBytes)

        val offset = hash[hash.size - 1].toInt() and 0x0F
        val truncatedHash = ByteBuffer.wrap(hash, offset, 4).int and 0x7FFFFFFF
        val code = (truncatedHash % 10.0.pow(digits)).toInt().toString().padStart(digits, '0')

        return TotpCode(code, remainingTime)
    }

    private fun base32Decode(encoded: String): ByteArray {
        val cleanInput = encoded.uppercase().replace(Regex("[^A-Z2-7]"), "")
        val result = mutableListOf<Byte>()
        var buffer = 0
        var bitsLeft = 0

        for (char in cleanInput) {
            val value = BASE32_CHARS.indexOf(char)
            if (value == -1) continue

            buffer = (buffer shl 5) or value
            bitsLeft += 5

            if (bitsLeft >= 8) {
                result.add((buffer shr (bitsLeft - 8)).toByte())
                bitsLeft -= 8
            }
        }

        return result.toByteArray()
    }

    fun parseQrCodeUri(uri: String): TotpEntry? {
        try {
            if (!uri.startsWith("otpauth://totp/")) return null

            val url = java.net.URL(uri)
            val params = url.query?.split("&")?.associate { param ->
                val (key, value) = param.split("=", limit = 2)
                key to java.net.URLDecoder.decode(value, "UTF-8")
            } ?: emptyMap()

            val secret = params["secret"] ?: return null
            val issuer = params["issuer"] ?: ""
            val algorithm = params["algorithm"] ?: "SHA1"
            val digits = params["digits"]?.toIntOrNull() ?: 6
            val period = params["period"]?.toIntOrNull() ?: 30

            val path = url.path.removePrefix("/")
            val name = if (path.contains(":")) {
                path.substringAfter(":")
            } else {
                path
            }

            return TotpEntry(
                name = name,
                issuer = issuer,
                secret = secret,
                algorithm = algorithm,
                digits = digits,
                period = period
            )
        } catch (e: Exception) {
            return null
        }
    }
}

// 3. QR Code Scanner Screen
@Composable
fun QrScannerScreen(
    onQrCodeScanned: (String) -> Unit,
    onNavigateBack: () -> Unit
) {
    var hasPermission by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasPermission = isGranted
    }

    LaunchedEffect(Unit) {
        when (PackageManager.PERMISSION_GRANTED) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) -> {
                hasPermission = true
            }
            else -> {
                permissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Top Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onNavigateBack) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
            Text(
                text = "Scan QR Code",
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.width(48.dp))
        }

        if (hasPermission) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                // Camera preview would go here - you'll need to implement with CameraX
                // This is a placeholder for the camera preview
                Box(
                    modifier = Modifier
                        .size(300.dp)
                        .border(2.dp, Color.White, RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Camera Preview\n(Implement with CameraX)",
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                }

                // Scanning overlay
                Box(
                    modifier = Modifier
                        .size(250.dp)
                        .border(3.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(12.dp))
                )
            }
        } else {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Camera permission is required\nto scan QR codes",
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }
                    ) {
                        Text("Grant Permission")
                    }
                }
            }
        }
    }
}

// 4. Manual Entry Screen

// 4. Manual Entry Screen
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManualTotpEntryScreen(
    onSave: (TotpEntry) -> Unit,
    onNavigateBack: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var issuer by remember { mutableStateOf("") }
    var secret by remember { mutableStateOf("") }
    var algorithm by remember { mutableStateOf("SHA1") }
    var digits by remember { mutableStateOf(6) }
    var period by remember { mutableStateOf(30) }
    var showAdvancedOptions by remember { mutableStateOf(false) }

    val isValid = name.isNotBlank() && secret.isNotBlank()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top Bar
        TopAppBar(
            title = { Text("Add TOTP Manually") },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            actions = {
                TextButton(
                    onClick = {
                        if (isValid) {
                            onSave(
                                TotpEntry(
                                    name = name.trim(),
                                    issuer = issuer.trim(),
                                    secret = secret.trim().uppercase(),
                                    algorithm = algorithm,
                                    digits = digits,
                                    period = period
                                )
                            )
                        }
                    },
                    enabled = isValid
                ) {
                    Text("Save")
                }
            }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Account Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }

            item {
                OutlinedTextField(
                    value = issuer,
                    onValueChange = { issuer = it },
                    label = { Text("Issuer (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }

            item {
                OutlinedTextField(
                    value = secret,
                    onValueChange = { secret = it },
                    label = { Text("Secret Key") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    supportingText = {
                        Text("Enter the secret key provided by the service")
                    }
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Advanced Options",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Switch(
                        checked = showAdvancedOptions,
                        onCheckedChange = { showAdvancedOptions = it }
                    )
                }
            }

            if (showAdvancedOptions) {
                item {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(text = "Algorithm", style = MaterialTheme.typography.labelLarge)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("SHA1", "SHA256", "SHA512").forEach { algo ->
                                FilterChip(
                                    selected = algorithm == algo,
                                    onClick = { algorithm = algo },
                                    label = { Text(algo) }
                                )
                            }
                        }

                        Text("Code Length: $digits digits", style = MaterialTheme.typography.labelLarge)
                        Slider(
                            value = digits.toFloat(),
                            onValueChange = { digits = it.toInt() },
                            valueRange = 4f..8f,
                            steps = 3
                        )

                        Text("Update Interval: $period seconds", style = MaterialTheme.typography.labelLarge)
                        Slider(
                            value = period.toFloat(),
                            onValueChange = { period = it.toInt() },
                            valueRange = 15f..120f,
                            steps = 6
                        )
                    }
                }
            }

            // Preview
            if (isValid && secret.length >= 16) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Preview",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))

                            val totpResult = remember(secret, algorithm, digits, period) {
                                runCatching {
                                    TotpUtil.generateTotpCode(
                                        secret = secret.trim().uppercase(),
                                        algorithm = algorithm,
                                        digits = digits,
                                        period = period
                                    )
                                }
                            }

                            totpResult.fold(
                                onSuccess = { totpCode ->
                                    Text(
                                        text = totpCode.code,
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Refreshes in ${totpCode.remainingTime}s",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                },
                                onFailure = {
                                    Text(
                                        text = "Invalid secret key",
                                        color = MaterialTheme.colorScheme.error
                                    )
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

// 5. Add TOTP Options Screen
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTotpOptionsScreen(
    onScanQrCode: () -> Unit,
    onManualEntry: () -> Unit,
    onNavigateBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopAppBar(
            title = { Text("Add Authenticator") },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Choose how to add your account",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // QR Code Option
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onScanQrCode() },
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Scan QR Code",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Scan the QR code provided by the service",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Manual Entry Option
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onManualEntry() },
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "Enter Manually",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Type in the secret key manually",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Help Text
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "How to set up 2FA",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "1. Go to your account's security settings\n" +
                                        "2. Enable two-factor authentication\n" +
                                        "3. Choose 'Authenticator app' option\n" +
                                        "4. Use one of the methods above to add it here",
                                style = MaterialTheme.typography.bodySmall,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

// 6. TOTP List Item Component
@Composable
fun TotpListItem(
    entry: TotpEntry,
    currentCode: TotpCode,
    onCopyCode: (String) -> Unit,
    onEdit: (TotpEntry) -> Unit,
    onDelete: (TotpEntry) -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCopyCode(currentCode.code) },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = entry.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (entry.issuer.isNotBlank()) {
                        Text(
                            text = entry.issuer,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "Options"
                        )
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Edit") },
                            onClick = {
                                showMenu = false
                                onEdit(entry)
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Edit, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Delete") },
                            onClick = {
                                showMenu = false
                                onDelete(entry)
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Delete, contentDescription = null)
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = currentCode.code,
                    style = MaterialTheme.typography.headlineMedium,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    CircularProgressIndicator(
                        progress = currentCode.remainingTime / entry.period.toFloat(),
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 3.dp
                    )
                    Text(
                        text = "${currentCode.remainingTime}s",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// 7. TOTP List Screen
@Preview
@Composable
private fun PreviewTotpListScreen() {
    val sampleEntries = listOf(
        TotpEntry(
            name = "GitHub",
            issuer = "GitHub",
            secret = "JBSWY3DPEHPK3PXP",
            algorithm = "SHA1",
            digits = 6,
            period = 30
        ),
    )

    HashegerTheme {
        TotpListScreen(sampleEntries, {}, {}, {}, {})
    }
    
}

@Preview
@Composable
private fun PreviewAddTotpOptionsScreen() {
    HashegerTheme {
        AddTotpOptionsScreen({}, {}, {})
    }
}

@Preview
@Composable
private fun PreviewManualTotpEntryScreen() {
    HashegerTheme {
        ManualTotpEntryScreen({}, {})
    }
}