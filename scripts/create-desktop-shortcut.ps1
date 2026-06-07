$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$iconIco = Join-Path $projectRoot 'build\icon.ico'
$appUserModelId = 'com.rocketshift.app'

function Get-RocketShiftExePath {
    param([string]$Root)
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Rocket Shift\Rocket Shift.exe'),
        (Join-Path $Root 'release\win-unpacked\Rocket Shift.exe')
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }
    Write-Error 'Run: npm run build:dir — or install Rocket Shift from the setup exe.'
}

function Set-ShortcutAppUserModelId {
    param(
        [Parameter(Mandatory = $true)][string]$ShortcutPath,
        [Parameter(Mandatory = $true)][string]$AppId
    )

    if (-not ('RocketShiftShortcutProps' -as [type])) {
        Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class RocketShiftShortcutProps {
    [DllImport("propsys.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    private static extern void PSGetPropertyKeyFromName(
        [MarshalAs(UnmanagedType.LPWStr)] string name,
        out PROPERTYKEY pk);

    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    public struct PROPERTYKEY {
        public Guid fmtid;
        public uint pid;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct PropVariant {
        [FieldOffset(0)] public ushort vt;
        [FieldOffset(8)] public IntPtr ptr;
    }

    [ComImport, Guid("00021401-0000-0000-C000-000000000046")]
    private class ShellLink { }

    [ComImport, Guid("000214F9-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IShellLinkW {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile, int cchMaxPath, IntPtr pfd, int fFlags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName, int cchMaxName);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir, int cchMaxPath);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs, int cchMaxPath);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath, int cchIconPath, out int piIcon);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
        void Resolve(IntPtr hwnd, int fFlags);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
    }

    [ComImport, Guid("0000010c-0000-0000-c000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IPersistFile {
        void GetClassID(out Guid pClassID);
        [PreserveSig] int IsDirty();
        [PreserveSig] int Load([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, uint dwMode);
        [PreserveSig] int Save([MarshalAs(UnmanagedType.LPWStr)] string pszFileName, bool fRemember);
        void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string pszFileName);
        void GetCurFile([MarshalAs(UnmanagedType.LPWStr)] out string ppszFileName);
    }

    [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IPropertyStore {
        void GetCount(out uint cProps);
        void GetAt(uint iProp, out PROPERTYKEY pkey);
        void GetValue(ref PROPERTYKEY key, out PropVariant pv);
        void SetValue(ref PROPERTYKEY key, ref PropVariant pv);
        void Commit();
    }

    public static void Apply(string shortcutPath, string appId) {
        IShellLinkW link = (IShellLinkW)new ShellLink();
        IPersistFile file = (IPersistFile)link;
        file.Load(shortcutPath, 2);

        IPropertyStore store = (IPropertyStore)link;
        PROPERTYKEY key;
        PSGetPropertyKeyFromName("System.AppUserModel.ID", out key);

        PropVariant value = new PropVariant();
        value.vt = 31; // VT_LPWSTR
        value.ptr = Marshal.StringToCoTaskMemUni(appId);
        store.SetValue(ref key, ref value);
        store.Commit();
        Marshal.FreeCoTaskMem(value.ptr);

        file.Save(shortcutPath, true);
    }
}
'@
    }

    [RocketShiftShortcutProps]::Apply($ShortcutPath, $AppId)
}

$exePath = Get-RocketShiftExePath -Root $projectRoot
$bundledIco = Join-Path (Split-Path $exePath -Parent) 'app-icon.ico'

if (-not (Test-Path $iconIco)) {
    Write-Error 'Run: npm run generate:icon'
}

Copy-Item $iconIco $bundledIco -Force

function Invoke-DesktopIconRefresh {
    $ie4u = Join-Path $env:SystemRoot 'System32\ie4uinit.exe'
    if (Test-Path $ie4u) {
        Start-Process $ie4u -ArgumentList '-show' -Wait -NoNewWindow
    }
    if (-not ('ShellNotify' -as [type])) {
        Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class ShellNotify {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
'@
    }
    [ShellNotify]::SHChangeNotify(0x08000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
}

$folders = New-Object System.Collections.Generic.List[string]
[void]$folders.Add([Environment]::GetFolderPath('Desktop'))
$od = Join-Path $env:USERPROFILE 'OneDrive\Desktop'
if (Test-Path $od) { [void]$folders.Add($od) }

$created = @()
foreach ($desktop in ($folders | Select-Object -Unique)) {
    Remove-Item (Join-Path $desktop 'Rocket Shift.ico') -Force -ErrorAction SilentlyContinue
    $lnk = Join-Path $desktop 'Rocket Shift.lnk'
    if (Test-Path $lnk) { Remove-Item $lnk -Force }

    $sc = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
    $sc.TargetPath = $exePath
    $sc.WorkingDirectory = Split-Path $exePath -Parent
    # Use .ico file, not exe — desktop icon cache often keeps the old Electron exe icon.
    $sc.IconLocation = "$bundledIco,0"
    $sc.Description = 'Rocket Shift'
    $sc.Save()

    try {
        Set-ShortcutAppUserModelId -ShortcutPath $lnk -AppId $appUserModelId
    } catch {
        Write-Warning "AppUserModelId not set for $lnk : $($_.Exception.Message)"
    }

    if (Test-Path $lnk) {
        $created += $lnk
        Write-Host "Created: $lnk"
        Write-Host "Target: $exePath"
        Write-Host "AppUserModelId: $appUserModelId"
    }
}

if ($created.Count -eq 0) {
    Write-Error 'Shortcut create failed'
}

Invoke-DesktopIconRefresh
Write-Host ''
Write-Host 'If the taskbar shows two rocket icons: unpin both, then pin this shortcut once.'
Write-Host "Path: $($created[0])"
Start-Process explorer.exe "/select,$($created[0])"
