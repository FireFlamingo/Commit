package org.exstagium.hasheger.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Dangerous
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Games
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Pin
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import org.exstagium.hasheger.ui.theme.HashegerTheme
import kotlin.math.log2

data class PasswordStrengthAnalysis(
    val score: Int,
    val strength: PasswordStrength,
    val entropy: Double,
    val crackTime: String,
    val issues: List<SecurityIssue>,
    val improvements: List<String>,
    val categoryScores: Map<String, Boolean>
)

data class SecurityIssue(
    val type: IssueType,
    val message: String,
    val severity: IssueSeverity
)

enum class IssueType {
    LENGTH, REPETITION, DICTIONARY, PATTERN, KEYBOARD_WALK, PERSONAL_INFO
}

enum class IssueSeverity {
    LOW, MEDIUM, HIGH, CRITICAL
}

data class PasswordTemplate(
    val name: String,
    val description: String,
    val icon: ImageVector,
    val minLength: Int,
    val requireUppercase: Boolean,
    val requireLowercase: Boolean,
    val requireNumbers: Boolean,
    val requireSymbols: Boolean,
    val excludeSimilar: Boolean,
    val pattern: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AIPasswordGeneratorScreen(navController: NavController) {
    var generatedPassword by remember { mutableStateOf("") }
    var passwordLength by remember { mutableStateOf(16f) }
    var includeUppercase by remember { mutableStateOf(true) }
    var includeLowercase by remember { mutableStateOf(true) }
    var includeNumbers by remember { mutableStateOf(true) }
    var includeSymbols by remember { mutableStateOf(true) }
    var excludeSimilar by remember { mutableStateOf(true) }
    var excludeAmbiguous by remember { mutableStateOf(true) }
    var customCharacters by remember { mutableStateOf("") }
    var selectedTemplate by remember { mutableStateOf<PasswordTemplate?>(null) }
    var showAdvancedOptions by remember { mutableStateOf(false) }
    var showSecurityAnalysis by remember { mutableStateOf(false) }
    var aiMode by remember { mutableStateOf(false) }
    var contextualInfo by remember { mutableStateOf("") }

    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    val passwordAnalysis = remember(generatedPassword) {
        if (generatedPassword.isNotEmpty()) {
            analyzePasswordStrength(generatedPassword)
        } else analysis
    }

    val templates = remember {
        listOf(
            PasswordTemplate(
                "High Security",
                "Maximum security for critical accounts",
                Icons.Default.Security,
                20,
                true,
                true,
                true,
                true,
                true
            ),
            PasswordTemplate(
                "Standard",
                "Balanced security for everyday use",
                Icons.Default.Lock,
                12,
                true,
                true,
                true,
                true,
                false
            ),
            PasswordTemplate(
                "PIN",
                "Numeric PIN for quick access",
                Icons.Default.Pin,
                6,
                false,
                false,
                true,
                false,
                false
            ),
            PasswordTemplate(
                "Simpler",
                "Easy to remember word combination",
                Icons.Default.TextFields,
                16,
                true,
                true,
                false,
                false,
                false
            ),
            PasswordTemplate(
                "Gaming",
                "Gaming platform optimized",
                Icons.Default.Games,
                14,
                true,
                true,
                true,
                false,
                true
            ),
            PasswordTemplate(
                "Banking",
                "Financial service grade security",
                Icons.Default.AccountBalance,
                18,
                true,
                true,
                true,
                true,
                true
            ),
            PasswordTemplate(
                "WiFi",
                "Router and network passwords",
                Icons.Default.Wifi,
                15,
                true,
                true,
                true,
                true,
                true
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Password Generator",
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
                actions = {
                    IconButton(onClick = { aiMode = !aiMode }) {
                        Icon(
                            if (aiMode) Icons.Default.Psychology else Icons.Default.AutoAwesome,
                            contentDescription = "Toggle AI Mode",
                            tint = if (aiMode) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // AI Context Input (if AI mode is enabled)
            if (aiMode) {
                item {
                    AIContextCard(
                        contextualInfo = contextualInfo,
                        onContextChange = { contextualInfo = it }
                    )
                }
            }

            // Generated Password Display
            item {
                GeneratedPasswordCard(
                    password = generatedPassword,
                    aiMode = aiMode,
                    onCopy = {
                        clipboardManager.setText(AnnotatedString(generatedPassword))
                        Toast.makeText(context, "Password copied to clipboard", Toast.LENGTH_SHORT)
                            .show()
                    },
                    onRegenerate = {
                        generatedPassword = generatePassword(
                            length = passwordLength.toInt(),
                            includeUppercase = includeUppercase,
                            includeLowercase = includeLowercase,
                            includeNumbers = includeNumbers,
                            includeSymbols = includeSymbols,
                            excludeSimilar = excludeSimilar,
                            excludeAmbiguous = excludeAmbiguous,
                            customCharacters = customCharacters,
                            template = selectedTemplate,
                            aiMode = aiMode,
                            context = contextualInfo
                        )
                    }
                )
            }

            // Password Analysis
            passwordAnalysis?.let { analysis ->
                item {
                    PasswordAnalysisCard(
                        analysis = analysis,
                        onTogglePasswordAnalysis = {
                            showSecurityAnalysis = !showSecurityAnalysis
                        },
                        showSecurityAnalysis = showSecurityAnalysis
                    )
                }
            }

            // Quick Templates
            item {
                QuickTemplatesCard(
                    templates = templates,
                    selectedTemplate = selectedTemplate,
                    onTemplateSelected = { template ->
                        selectedTemplate = template
                        passwordLength = template.minLength.toFloat()
                        includeUppercase = template.requireUppercase
                        includeLowercase = template.requireLowercase
                        includeNumbers = template.requireNumbers
                        includeSymbols = template.requireSymbols
                        excludeSimilar = template.excludeSimilar
                    }
                )
            }

            // Generation Options
            item {
                GenerationOptionsCard(
                    passwordLength = passwordLength,
                    onLengthChange = { passwordLength = it },
                    includeUppercase = includeUppercase,
                    onUppercaseChange = { includeUppercase = it },
                    includeLowercase = includeLowercase,
                    onLowercaseChange = { includeLowercase = it },
                    includeNumbers = includeNumbers,
                    onNumbersChange = { includeNumbers = it },
                    includeSymbols = includeSymbols,
                    onSymbolsChange = { includeSymbols = it },
                    excludeSimilar = excludeSimilar,
                    onExcludeSimilarChange = { excludeSimilar = it },
                    excludeAmbiguous = excludeAmbiguous,
                    onExcludeAmbiguousChange = { excludeAmbiguous = it }
                )
            }

            // Advanced Options
            item {
                AdvancedOptionsCard(
                    showAdvanced = showAdvancedOptions,
                    onToggleAdvanced = { showAdvancedOptions = !showAdvancedOptions },
                    customCharacters = customCharacters,
                    onCustomCharactersChange = { customCharacters = it }
                )
            }

            // Security Guidelines
            item {
                SecurityGuidelinesCard()
            }

            // Generate Button
            item {
                Button(
                    onClick = {
                        generatedPassword = generatePassword(
                            length = passwordLength.toInt(),
                            includeUppercase = includeUppercase,
                            includeLowercase = includeLowercase,
                            includeNumbers = includeNumbers,
                            includeSymbols = includeSymbols,
                            excludeSimilar = excludeSimilar,
                            excludeAmbiguous = excludeAmbiguous,
                            customCharacters = customCharacters,
                            template = selectedTemplate,
                            aiMode = aiMode,
                            context = contextualInfo
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(
                        imageVector = if (aiMode) Icons.Default.Psychology else Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (aiMode) "Generate with AI" else "Generate Password",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AIContextCard(
    contextualInfo: String,
    onContextChange: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Psychology,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "AI Context",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Text(
                text = "Provide context for AI-optimized password generation (e.g., 'banking app', 'gaming account', 'work email')",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = contextualInfo,
                onValueChange = onContextChange,
                placeholder = { Text("Enter context for smarter generation...") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                    focusedBorderColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    }
}

@Composable
private fun GeneratedPasswordCard(
    password: String,
    aiMode: Boolean,
    onCopy: () -> Unit,
    onRegenerate: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Generated Password",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Row {
                    IconButton(onClick = onRegenerate) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Regenerate",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = onCopy) {
                        Icon(
                            Icons.Default.ContentCopy,
                            contentDescription = "Copy",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            if (password.isNotEmpty()) {
                SelectionContainer {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = password,
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.titleLarge,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .background(
                            MaterialTheme.colorScheme.surface,
                            RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Click Generate to create password",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }


            Column {
                Button(
                    onClick = {
                        onRegenerate()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(
                        imageVector = if (aiMode) Icons.Default.Psychology else Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (aiMode) "Generate with AI" else "Generate Password",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }


        }
    }
}

val analysis = PasswordStrengthAnalysis(
    score = 3, // out of 4 or 5 depending on your system
    strength = PasswordStrength.STRONG,
    entropy = 58.4, // bits of entropy
    crackTime = "3 years (10B guesses/sec)",
    issues = listOf(
        SecurityIssue(
            type = IssueType.LENGTH,
            message = "Password is shorter than 12 characters.",
            severity = IssueSeverity.HIGH
        ),
        SecurityIssue(
            type = IssueType.PATTERN,
            message = "Password lacks special characters.",
            severity = IssueSeverity.MEDIUM
        ),
        SecurityIssue(
            type = IssueType.KEYBOARD_WALK,
            message = "Password contains a common dictionary word.",
            severity = IssueSeverity.CRITICAL
        )
    ),
    improvements = listOf(
        "Add more special characters",
        "Avoid common words or patterns",
        "Increase overall length"
    ),
    categoryScores = mapOf(
        "Length >= 12" to true,
        "Uppercase letters" to true,
        "Lowercase letters" to true,
        "Numbers" to true,
        "Special characters" to false,
        "No dictionary words" to false
    )
)


@Composable
private fun PasswordAnalysisCard(
    analysis: PasswordStrengthAnalysis,
    onTogglePasswordAnalysis: () -> Unit,
    showSecurityAnalysis: Boolean
) {
    val strengthColor by animateColorAsState(
        targetValue = when (analysis.strength) {
            PasswordStrength.WEAK -> MaterialTheme.colorScheme.error
            PasswordStrength.MEDIUM -> MaterialTheme.colorScheme.tertiary
            PasswordStrength.STRONG -> MaterialTheme.colorScheme.primary
        },
        animationSpec = tween(500)
    )

    val strengthProgress by animateFloatAsState(
        targetValue = analysis.score / 100f,
        animationSpec = tween(1000)
    )

    @Composable
    fun renderContent() {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceContainer
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            )
            {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Analytics,
                        contentDescription = null,
                        tint = strengthColor,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Security Analysis",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Strength Meter
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Overall Strength: ${
                                analysis.strength.name.lowercase()
                                    .replaceFirstChar { it.uppercase() }
                            }",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium,
                            color = strengthColor
                        )
                        Text(
                            text = "${analysis.score}/100",
                            style = MaterialTheme.typography.bodyMedium,
                            color = strengthColor
                        )
                    }

                    LinearProgressIndicator(
                        progress = strengthProgress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = strengthColor,
                        trackColor = strengthColor.copy(alpha = 0.2f)
                    )
                }

                // Security Metrics
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    SecurityMetric("Entropy", "${analysis.entropy.toInt()} bits")
                    SecurityMetric("Crack Time", analysis.crackTime)
                }

                // Category Checklist
                Text(
                    text = "Security Checklist",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(analysis.categoryScores.toList()) { (category, passed) ->
                        SecurityCheckItem(category, passed)
                    }
                }

                // Issues and Improvements
                if (analysis.issues.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Security Issues",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.error
                        )
                        analysis.issues.forEach { issue ->
                            SecurityIssueItem(issue)
                        }
                    }
                }

                if (analysis.improvements.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Suggestions",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        analysis.improvements.forEach { improvement ->
                            SuggestionItem(improvement)
                        }
                    }
                }
            }
        }
    }

    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onTogglePasswordAnalysis() },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Password Security Analysis",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = if (showSecurityAnalysis) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            AnimatedVisibility(
                visible = showSecurityAnalysis,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                renderContent()
            }
        }
    }

}

@Composable
private fun SecurityMetric(label: String, value: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun SecurityCheckItem(category: String, passed: Boolean) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (passed)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.errorContainer
        ),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (passed) Icons.Default.CheckCircle else Icons.Default.Cancel,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = if (passed) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = category,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = if (passed) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}

@Composable
private fun SecurityIssueItem(issue: SecurityIssue) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f),
                RoundedCornerShape(8.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = when (issue.severity) {
                IssueSeverity.CRITICAL -> Icons.Default.Dangerous
                IssueSeverity.HIGH -> Icons.Default.Warning
                IssueSeverity.MEDIUM -> Icons.Default.Info
                IssueSeverity.LOW -> Icons.Default.NotificationsActive
            },
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = issue.message,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onErrorContainer
        )
    }
}

@Composable
private fun SuggestionItem(suggestion: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f),
                RoundedCornerShape(8.dp)
            )
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Lightbulb,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = suggestion,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
private fun QuickTemplatesCard(
    templates: List<PasswordTemplate>,
    selectedTemplate: PasswordTemplate?,
    onTemplateSelected: (PasswordTemplate) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Quick Templates",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(templates) { template ->
                    TemplateChip(
                        template = template,
                        isSelected = selectedTemplate == template,
                        onClick = { onTemplateSelected(template) }
                    )
                }
            }
        }
    }
}

@Composable
private fun TemplateChip(
    template: PasswordTemplate,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surface
        ),
        shape = RoundedCornerShape(12.dp),
        border = if (isSelected)
            null
        else
            BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier.padding(8.dp).size(58.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceEvenly
        ) {
            Icon(
                imageVector = template.icon,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = template.name,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Normal,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun GenerationOptionsCard(
    passwordLength: Float,
    onLengthChange: (Float) -> Unit,
    includeUppercase: Boolean,
    onUppercaseChange: (Boolean) -> Unit,
    includeLowercase: Boolean,
    onLowercaseChange: (Boolean) -> Unit,
    includeNumbers: Boolean,
    onNumbersChange: (Boolean) -> Unit,
    includeSymbols: Boolean,
    onSymbolsChange: (Boolean) -> Unit,
    excludeSimilar: Boolean,
    onExcludeSimilarChange: (Boolean) -> Unit,
    excludeAmbiguous: Boolean,
    onExcludeAmbiguousChange: (Boolean) -> Unit
) {
    Card(
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
                text = "Generation Options",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            // Password Length
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Password Length",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = passwordLength.toInt().toString(),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Slider(
                    value = passwordLength,
                    onValueChange = onLengthChange,
                    valueRange = 4f..64f,
                    steps = 59,
                    colors = SliderDefaults.colors(
                        thumbColor = MaterialTheme.colorScheme.primary,
                        activeTrackColor = MaterialTheme.colorScheme.primary
                    )
                )
            }

            // Character Type Options
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OptionToggle("Uppercase Letters (A-Z)", "ABC", includeUppercase, onUppercaseChange)
                OptionToggle("Lowercase Letters (a-z)", "abc", includeLowercase, onLowercaseChange)
                OptionToggle("Numbers (0-9)", "123", includeNumbers, onNumbersChange)
                OptionToggle("Symbols (!@#\$%)", "!@#", includeSymbols, onSymbolsChange)
            }

            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            // Advanced Toggles
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OptionToggle(
                    "Exclude Similar Characters",
                    "0oO1lI",
                    excludeSimilar,
                    onExcludeSimilarChange
                )
                OptionToggle(
                    "Exclude Ambiguous Characters",
                    "{}[]()~",
                    excludeAmbiguous,
                    onExcludeAmbiguousChange
                )
            }
        }
    }
}

@Composable
private fun OptionToggle(
    title: String,
    preview: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = preview,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontFamily = FontFamily.Monospace
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun AdvancedOptionsCard(
    showAdvanced: Boolean,
    onToggleAdvanced: () -> Unit,
    customCharacters: String,
    onCustomCharactersChange: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggleAdvanced() },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Advanced Options",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = if (showAdvanced) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            AnimatedVisibility(
                visible = showAdvanced,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = customCharacters,
                        onValueChange = onCustomCharactersChange,
                        placeholder = { Text("Custom characters to include") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun SecurityGuidelinesCard() {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Password Security Guidelines",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "• Use at least 12 characters\n" +
                        "• Include uppercase, lowercase, numbers, and symbols\n" +
                        "• Avoid dictionary words or predictable patterns\n" +
                        "• Do not reuse passwords across accounts\n" +
                        "• Consider using AI-generated passwords for critical accounts",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ------------------- Password Generator Functions -------------------

fun generatePassword(
    length: Int,
    includeUppercase: Boolean,
    includeLowercase: Boolean,
    includeNumbers: Boolean,
    includeSymbols: Boolean,
    excludeSimilar: Boolean,
    excludeAmbiguous: Boolean,
    customCharacters: String,
    template: PasswordTemplate?,
    aiMode: Boolean,
    context: String
): String {
    val upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    val lower = "abcdefghijkmnopqrstuvwxyz"
    val numbers = "23456789"
    val symbols = "!@#\$%^&*()-_=+[]{}|;:,.<>?/"

    var charPool = StringBuilder()
    if (includeUppercase) charPool.append(upper)
    if (includeLowercase) charPool.append(lower)
    if (includeNumbers) charPool.append(numbers)
    if (includeSymbols) charPool.append(symbols)
    if (customCharacters.isNotEmpty()) charPool.append(customCharacters)

    // AI mode placeholder: could use context to bias selection or call backend
    if (aiMode && context.isNotBlank()) {
        // Example: append context-derived chars or logic
        charPool.append(context.filter { it.isLetterOrDigit() })
    }

    if (charPool.isEmpty()) return ""

    return (1..length).map { charPool.random() }.joinToString("")
}

fun analyzePasswordStrength(password: String): PasswordStrengthAnalysis {
    val score = calculatePasswordScore(password)
    val strength = when {
        score < 40 -> PasswordStrength.WEAK
        score < 70 -> PasswordStrength.MEDIUM
        else -> PasswordStrength.STRONG
    }
    val entropy = log2((password.length * 95).toDouble()) // rough estimation
    val crackTime = when (strength) {
        PasswordStrength.WEAK -> "<1 min"
        PasswordStrength.MEDIUM -> "hours"
        PasswordStrength.STRONG -> "years"
    }

    val issues = mutableListOf<SecurityIssue>()
    if (password.length < 12) issues.add(
        SecurityIssue(
            IssueType.LENGTH,
            "Password too short",
            IssueSeverity.HIGH
        )
    )
    if (!password.any { it.isUpperCase() }) issues.add(
        SecurityIssue(
            IssueType.PATTERN,
            "No uppercase letters",
            IssueSeverity.MEDIUM
        )
    )
    if (!password.any { it.isLowerCase() }) issues.add(
        SecurityIssue(
            IssueType.PATTERN,
            "No lowercase letters",
            IssueSeverity.MEDIUM
        )
    )
    if (!password.any { it.isDigit() }) issues.add(
        SecurityIssue(
            IssueType.PATTERN,
            "No numbers",
            IssueSeverity.MEDIUM
        )
    )
    if (!password.any { "!@#\$%^&*()-_=+[]{}|;:,.<>?/".contains(it) }) issues.add(
        SecurityIssue(
            IssueType.PATTERN,
            "No symbols",
            IssueSeverity.MEDIUM
        )
    )

    val improvements = listOf("Increase length", "Add uppercase, lowercase, numbers, symbols")
    val categoryScores = mapOf(
        "Length" to (password.length >= 12),
        "Uppercase" to password.any { it.isUpperCase() },
        "Lowercase" to password.any { it.isLowerCase() },
        "Numbers" to password.any { it.isDigit() },
        "Symbols" to password.any { "!@#\$%^&*()-_=+[]{}|;:,.<>?/".contains(it) }
    )

    return PasswordStrengthAnalysis(
        score,
        strength,
        entropy,
        crackTime,
        issues,
        improvements,
        categoryScores
    )
}

fun calculatePasswordScore(password: String): Int {
    var score = 0
    if (password.length >= 12) score += 20
    if (password.any { it.isUpperCase() }) score += 15
    if (password.any { it.isLowerCase() }) score += 15
    if (password.any { it.isDigit() }) score += 20
    if (password.any { "!@#$%^&*()-_=+[]{}|;:,.<>?/".contains(it) }) score += 30
    return score.coerceAtMost(100)
}

@Preview
@Composable
private fun PasswordGeneratorScreenPreview() {
    val navController = rememberNavController()
    HashegerTheme {
        AIPasswordGeneratorScreen(navController)
    }
}