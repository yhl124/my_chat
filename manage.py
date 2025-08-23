#!/usr/bin/env python3
"""
AI Chat Platform Management Tool

통합 명령어 도구로 프론트엔드, 백엔드, 전체 시스템을 관리할 수 있습니다.

사용법:
    python manage.py <command> [options]

명령어:
    start [service]     - 서비스 시작 (all, frontend, backend)
    stop [service]      - 서비스 중지 (all, frontend, backend) 
    restart [service]   - 서비스 재시작 (all, frontend, backend)
    status             - 서비스 상태 확인
    logs [service]     - 로그 확인 (backend, frontend, all)
    clean              - 로그 파일 정리
    health             - 전체 시스템 건강 상태 확인
    install            - 모든 의존성 설치

예시:
    python manage.py start all          # 모든 서비스 시작
    python manage.py start backend      # 백엔드만 시작  
    python manage.py stop all           # 모든 서비스 중지
    python manage.py restart frontend   # 프론트엔드 재시작
    python manage.py logs backend       # 백엔드 로그 확인
    python manage.py status             # 상태 확인
    python manage.py health             # 건강 상태 점검
"""

import os
import sys
import argparse
import subprocess
import time
import platform
import json
import psutil
from pathlib import Path
from typing import List, Optional, Dict


class Colors:
    """콘솔 색상 정의"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'


class AIChat:
    """AI Chat Platform 관리 클래스"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.frontend_dir = self.root_dir / 'front'
        self.backend_dir = self.root_dir / 'back'
        self.logs_dir = self.root_dir / 'logs'
        self.is_windows = platform.system() == 'Windows'
        
        # 기본 포트 설정
        self.ports = {
            'frontend': 3000,
            'backend': 3001, 
            'vllm': 8000
        }
        
        # 환경 변수에서 포트 재정의 가능
        self.ports['backend'] = int(os.getenv('PORT', self.ports['backend']))
        
        # 로그 디렉토리 생성
        self.logs_dir.mkdir(exist_ok=True)
    
    def print_header(self, title: str):
        """헤더 출력"""
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}  🤖 AI Chat Platform - {title}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}\n")
    
    def print_success(self, message: str):
        """성공 메시지 출력"""
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
    
    def print_error(self, message: str):
        """에러 메시지 출력"""
        print(f"{Colors.RED}❌ {message}{Colors.END}")
    
    def print_warning(self, message: str):
        """경고 메시지 출력"""
        print(f"{Colors.YELLOW}⚠️ {message}{Colors.END}")
    
    def print_info(self, message: str):
        """정보 메시지 출력"""
        print(f"{Colors.BLUE}ℹ️ {message}{Colors.END}")
    
    def run_command(self, command: List[str], cwd: Optional[Path] = None, background: bool = False) -> bool:
        """명령어 실행"""
        try:
            if background:
                if self.is_windows:
                    subprocess.Popen(command, cwd=cwd, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
                else:
                    subprocess.Popen(command, cwd=cwd, start_new_session=True)
                return True
            else:
                result = subprocess.run(command, cwd=cwd, check=True, capture_output=True, text=True)
                return result.returncode == 0
        except subprocess.CalledProcessError as e:
            self.print_error(f"명령어 실행 실패: {' '.join(command)}")
            self.print_error(f"오류: {e.stderr}")
            return False
        except FileNotFoundError:
            self.print_error(f"명령어를 찾을 수 없습니다: {command[0]}")
            return False
    
    def is_port_in_use(self, port: int) -> bool:
        """포트 사용 중인지 확인"""
        for conn in psutil.net_connections():
            if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                return True
        return False
    
    def get_service_pid(self, port: int) -> Optional[int]:
        """포트를 사용하는 프로세스 PID 반환"""
        for conn in psutil.net_connections():
            if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                return conn.pid
        return None
    
    def kill_process_on_port(self, port: int) -> bool:
        """특정 포트의 프로세스 종료"""
        pid = self.get_service_pid(port)
        if pid:
            try:
                process = psutil.Process(pid)
                process.terminate()
                time.sleep(2)
                if process.is_running():
                    process.kill()
                return True
            except psutil.NoSuchProcess:
                return True
            except Exception as e:
                self.print_error(f"프로세스 종료 실패: {e}")
                return False
        return True
    
    def install_dependencies(self):
        """모든 의존성 설치"""
        self.print_header("의존성 설치")
        
        # 백엔드 의존성 설치
        self.print_info("백엔드 의존성 설치 중...")
        if not self.run_command(['uv', 'sync'], cwd=self.backend_dir):
            self.print_error("백엔드 의존성 설치 실패")
            return False
        self.print_success("백엔드 의존성 설치 완료")
        
        # 프론트엔드 의존성 설치
        self.print_info("프론트엔드 의존성 설치 중...")
        if not self.run_command(['npm', 'install'], cwd=self.frontend_dir):
            self.print_error("프론트엔드 의존성 설치 실패")
            return False
        self.print_success("프론트엔드 의존성 설치 완료")
        
        self.print_success("모든 의존성 설치 완료!")
        return True
    
    def start_backend(self):
        """백엔드 시작"""
        self.print_info("백엔드 서버 시작 중...")
        
        if self.is_port_in_use(self.ports['backend']):
            self.print_warning(f"포트 {self.ports['backend']}이 이미 사용 중입니다")
            return False
        
        env = os.environ.copy()
        env['PORT'] = str(self.ports['backend'])
        
        command = ['uv', 'run', 'python', 'run.py']
        try:
            subprocess.Popen(
                command, 
                cwd=self.backend_dir,
                env=env,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if self.is_windows else 0,
                start_new_session=not self.is_windows
            )
            
            # 시작 대기
            time.sleep(3)
            if self.is_port_in_use(self.ports['backend']):
                self.print_success(f"백엔드 서버 시작됨 (포트 {self.ports['backend']})")
                return True
            else:
                self.print_error("백엔드 서버 시작 실패")
                return False
        except Exception as e:
            self.print_error(f"백엔드 시작 실패: {e}")
            return False
    
    def start_frontend(self):
        """프론트엔드 시작"""
        self.print_info("프론트엔드 서버 시작 중...")
        
        if self.is_port_in_use(self.ports['frontend']):
            self.print_warning(f"포트 {self.ports['frontend']}이 이미 사용 중입니다")
            return False
        
        # 브라우저 자동 실행 비활성화 환경 변수 설정
        env = os.environ.copy()
        env['BROWSER'] = 'none'
        env['NODE_ENV'] = 'development'
        
        command = ['npm', 'run', 'dev']
        try:
            subprocess.Popen(
                command,
                cwd=self.frontend_dir,
                env=env,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if self.is_windows else 0,
                start_new_session=not self.is_windows
            )
            
            # 시작 대기
            time.sleep(5)
            if self.is_port_in_use(self.ports['frontend']):
                self.print_success(f"프론트엔드 서버 시작됨 (포트 {self.ports['frontend']})")
                return True
            else:
                self.print_error("프론트엔드 서버 시작 실패")
                return False
        except Exception as e:
            self.print_error(f"프론트엔드 시작 실패: {e}")
            return False
    
    def stop_backend(self):
        """백엔드 중지"""
        self.print_info("백엔드 서버 중지 중...")
        if self.kill_process_on_port(self.ports['backend']):
            self.print_success("백엔드 서버 중지됨")
            return True
        else:
            self.print_error("백엔드 서버 중지 실패")
            return False
    
    def stop_frontend(self):
        """프론트엔드 중지"""
        self.print_info("프론트엔드 서버 중지 중...")
        if self.kill_process_on_port(self.ports['frontend']):
            self.print_success("프론트엔드 서버 중지됨") 
            return True
        else:
            self.print_error("프론트엔드 서버 중지 실패")
            return False
    
    def start_service(self, service: str):
        """서비스 시작"""
        self.print_header(f"{service.upper()} 시작")
        
        if service == 'all':
            success = True
            success &= self.start_backend()
            success &= self.start_frontend()
            
            if success:
                self.print_success("모든 서비스가 시작되었습니다!")
                self.print_info(f"프론트엔드: http://localhost:{self.ports['frontend']}")
                self.print_info(f"백엔드 API: http://localhost:{self.ports['backend']}")
                self.print_info(f"백엔드 문서: http://localhost:{self.ports['backend']}/docs")
            return success
        
        elif service == 'backend':
            return self.start_backend()
            
        elif service == 'frontend': 
            return self.start_frontend()
        
        else:
            self.print_error(f"알 수 없는 서비스: {service}")
            return False
    
    def stop_service(self, service: str):
        """서비스 중지"""
        self.print_header(f"{service.upper()} 중지")
        
        if service == 'all':
            success = True
            success &= self.stop_frontend()
            success &= self.stop_backend()
            
            if success:
                self.print_success("모든 서비스가 중지되었습니다!")
            return success
            
        elif service == 'backend':
            return self.stop_backend()
            
        elif service == 'frontend':
            return self.stop_frontend()
            
        else:
            self.print_error(f"알 수 없는 서비스: {service}")
            return False
    
    def restart_service(self, service: str):
        """서비스 재시작"""
        self.print_header(f"{service.upper()} 재시작")
        
        # 중지 후 시작
        self.stop_service(service)
        time.sleep(2)
        return self.start_service(service)
    
    def show_status(self):
        """서비스 상태 확인"""
        self.print_header("서비스 상태")
        
        # 백엔드 상태
        if self.is_port_in_use(self.ports['backend']):
            self.print_success(f"백엔드: 실행 중 (포트 {self.ports['backend']})")
        else:
            self.print_error(f"백엔드: 중지됨 (포트 {self.ports['backend']})")
        
        # 프론트엔드 상태
        if self.is_port_in_use(self.ports['frontend']):
            self.print_success(f"프론트엔드: 실행 중 (포트 {self.ports['frontend']})")
        else:
            self.print_error(f"프론트엔드: 중지됨 (포트 {self.ports['frontend']})")
        
        # vLLM 서버 상태 
        if self.is_port_in_use(self.ports['vllm']):
            self.print_success(f"vLLM 서버: 실행 중 (포트 {self.ports['vllm']})")
        else:
            self.print_warning(f"vLLM 서버: 중지됨 (포트 {self.ports['vllm']})")
            self.print_info("vLLM 서버는 별도로 실행해야 합니다")
    
    def show_logs(self, service: str):
        """로그 확인"""
        self.print_header(f"{service.upper()} 로그")
        
        if service == 'backend' or service == 'all':
            backend_log = self.logs_dir / 'backend.log'
            if backend_log.exists():
                self.print_info("백엔드 로그 (최근 20줄):")
                with open(backend_log, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line in lines[-20:]:
                        print(f"  {line.rstrip()}")
            else:
                self.print_warning("백엔드 로그 파일이 없습니다")
        
        if service == 'frontend' or service == 'all':
            frontend_log = self.logs_dir / 'frontend.log'
            if frontend_log.exists():
                self.print_info("프론트엔드 로그 (최근 20줄):")
                with open(frontend_log, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line in lines[-20:]:
                        print(f"  {line.rstrip()}")
            else:
                self.print_warning("프론트엔드 로그 파일이 없습니다")
    
    def clean_logs(self):
        """로그 파일 정리"""
        self.print_header("로그 정리")
        
        log_files = ['backend.log', 'backend_error.log', 'frontend.log', 'startup.log']
        cleaned = 0
        
        for log_file in log_files:
            log_path = self.logs_dir / log_file
            if log_path.exists():
                log_path.unlink()
                cleaned += 1
                self.print_info(f"삭제: {log_file}")
        
        if cleaned > 0:
            self.print_success(f"{cleaned}개의 로그 파일을 정리했습니다")
        else:
            self.print_info("정리할 로그 파일이 없습니다")
    
    def health_check(self):
        """전체 시스템 건강 상태 점검"""
        self.print_header("시스템 건강 상태 점검")
        
        # 기본 요구사항 확인
        self.print_info("기본 요구사항 확인...")
        
        # Python 확인
        try:
            result = subprocess.run(['python', '--version'], capture_output=True, text=True)
            self.print_success(f"Python: {result.stdout.strip()}")
        except FileNotFoundError:
            self.print_error("Python이 설치되어 있지 않습니다")
        
        # Node.js 확인  
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            self.print_success(f"Node.js: {result.stdout.strip()}")
        except FileNotFoundError:
            self.print_error("Node.js가 설치되어 있지 않습니다")
        
        # uv 확인
        try:
            result = subprocess.run(['uv', '--version'], capture_output=True, text=True)
            self.print_success(f"uv: {result.stdout.strip()}")
        except FileNotFoundError:
            self.print_error("uv가 설치되어 있지 않습니다")
        
        # 디렉토리 확인
        if self.frontend_dir.exists():
            self.print_success(f"프론트엔드 디렉토리: {self.frontend_dir}")
        else:
            self.print_error(f"프론트엔드 디렉토리가 없습니다: {self.frontend_dir}")
            
        if self.backend_dir.exists():
            self.print_success(f"백엔드 디렉토리: {self.backend_dir}")
        else:
            self.print_error(f"백엔드 디렉토리가 없습니다: {self.backend_dir}")
        
        # 서비스 상태 확인
        self.show_status()
        
        # vLLM 연결 테스트
        if self.is_port_in_use(self.ports['vllm']):
            try:
                import requests
                response = requests.get(f"http://localhost:{self.ports['vllm']}/v1/models", timeout=5)
                if response.status_code == 200:
                    self.print_success("vLLM 서버 연결 성공")
                else:
                    self.print_warning(f"vLLM 서버 응답 오류: {response.status_code}")
            except Exception as e:
                self.print_warning(f"vLLM 서버 연결 실패: {e}")
        
        # 백엔드 API 테스트
        if self.is_port_in_use(self.ports['backend']):
            try:
                import requests
                response = requests.get(f"http://localhost:{self.ports['backend']}/health", timeout=5)
                if response.status_code == 200:
                    self.print_success("백엔드 API 연결 성공")
                else:
                    self.print_warning(f"백엔드 API 응답 오류: {response.status_code}")
            except Exception as e:
                self.print_warning(f"백엔드 API 연결 실패: {e}")


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(
        description='AI Chat Platform Management Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python manage.py start all          # 모든 서비스 시작
  python manage.py start backend      # 백엔드만 시작  
  python manage.py stop all           # 모든 서비스 중지
  python manage.py restart frontend   # 프론트엔드 재시작
  python manage.py logs backend       # 백엔드 로그 확인
  python manage.py status             # 상태 확인
  python manage.py health             # 건강 상태 점검
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='사용 가능한 명령어')
    
    # start 명령어
    start_parser = subparsers.add_parser('start', help='서비스 시작')
    start_parser.add_argument('service', choices=['all', 'frontend', 'backend'], 
                             default='all', nargs='?', help='시작할 서비스')
    
    # stop 명령어
    stop_parser = subparsers.add_parser('stop', help='서비스 중지')
    stop_parser.add_argument('service', choices=['all', 'frontend', 'backend'],
                            default='all', nargs='?', help='중지할 서비스')
    
    # restart 명령어
    restart_parser = subparsers.add_parser('restart', help='서비스 재시작')
    restart_parser.add_argument('service', choices=['all', 'frontend', 'backend'],
                               default='all', nargs='?', help='재시작할 서비스')
    
    # 기타 명령어들
    subparsers.add_parser('status', help='서비스 상태 확인')
    
    logs_parser = subparsers.add_parser('logs', help='로그 확인')
    logs_parser.add_argument('service', choices=['all', 'frontend', 'backend'],
                            default='all', nargs='?', help='확인할 로그')
    
    subparsers.add_parser('clean', help='로그 파일 정리')
    subparsers.add_parser('health', help='시스템 건강 상태 확인')
    subparsers.add_parser('install', help='모든 의존성 설치')
    
    # 인수 파싱
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # AI Chat 인스턴스 생성
    ai_chat = AIChat()
    
    # 명령어 실행
    try:
        if args.command == 'start':
            ai_chat.start_service(args.service)
        elif args.command == 'stop':
            ai_chat.stop_service(args.service)
        elif args.command == 'restart':
            ai_chat.restart_service(args.service)
        elif args.command == 'status':
            ai_chat.show_status()
        elif args.command == 'logs':
            ai_chat.show_logs(args.service)
        elif args.command == 'clean':
            ai_chat.clean_logs()
        elif args.command == 'health':
            ai_chat.health_check()
        elif args.command == 'install':
            ai_chat.install_dependencies()
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}작업이 사용자에 의해 중단되었습니다.{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}예상치 못한 오류가 발생했습니다: {e}{Colors.END}")


if __name__ == '__main__':
    main()